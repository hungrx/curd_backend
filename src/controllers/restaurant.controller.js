import Restaurant from '../models/restaurant.model.js';
const DEFAULT_LOGO_PATH = '/restaurant-default-logo/restaurantdefaultlogo.webp';

import fs from 'fs/promises'; // For handling file operations

//================================================================
//To create a new restaurant
//================================================================

export const createRestaurant = async (req, res) => {
  try {
    const { restaurantName } = req.body;

    if (!restaurantName) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const existingRestaurant = await Restaurant.findOne({ restaurantName });
    if (existingRestaurant) {
      return res.status(400).json({ message: 'Restaurant already exists' });
    }

    let logoPath = DEFAULT_LOGO_PATH;

    if (req.file) {
      logoPath = req.file.path.replace(/\\/g, '/').replace('public', '');
    }

    const restaurant = new Restaurant({
      restaurantName,
      logo: logoPath,
      categories: [],
    });

    const newRestaurant = await restaurant.save();

    return res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant: newRestaurant,
    });
  } catch (error) {
    console.error('Create restaurant controller error:', error.message);
    res.status(500).json({
      message: 'Error creating restaurant',
      error: error.message,
    });
  }
};

//================================================================
//Delete a restaurant
//================================================================

export const deleteRestaurant = async (req, res) => {
  const { restaurantId } = req.params;
  console.log(restaurantId);

  const { deleteId } = req.body;
  console.log(deleteId);

  if (!deleteId) {
    return res.status(400).json({ message: 'Delete ID is required' });
  }

  // Validate ID
  if (!restaurantId) {
    return res.status(400).json({ message: 'Restaurant ID is required' });
  }
  const secretId = 'delete';

  if (deleteId !== secretId) {
    return res.status(400).json({ message: 'Invalid delete ID' });
  }
  try {
    // Check if the restaurant exists first
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Delete the logo file if it exists
    if (restaurant.logo && restaurant.logo !== DEFAULT_LOGO_PATH) {
      try {
        await fs.unlink(`public${restaurant.logo}`);
      } catch (err) {
        console.error('Error deleting logo file:', err.message);
      }
    }

    // Delete the restaurant from the database
    await Restaurant.findByIdAndDelete(restaurantId);

    return res.status(200).json({
      message: 'Restaurant deleted successfully',
      restaurantId,
    });
  } catch (error) {
    console.error('Delete restaurant controller error:', error.message);
    res.status(500).json({
      message: 'Error deleting restaurant',
      error: error.message,
    });
  }
};

//================================================================
//edit restaurant
//================================================================

export const editRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params; // Assuming the restaurant's ID is passed in the URL
    console.log(restaurantId);

    const { restaurantName } = req.body;

    // Find the restaurant by ID
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Update the restaurant name if provided
    if (restaurantName) {
      restaurant.restaurantName = restaurantName;
    }

    let logoPath = restaurant.logo; // Keep the existing logo if not updated

    // If a new logo is uploaded, update the logo path
    if (req.file) {
      logoPath = req.file.path.replace(/\\/g, '/').replace('public', '');
    }

    restaurant.logo = logoPath;

    // Save the updated restaurant
    const updatedRestaurant = await restaurant.save();

    return res.status(200).json({
      message: 'Restaurant updated successfully',
      restaurant: updatedRestaurant,
    });
  } catch (error) {
    console.error('Edit restaurant controller error:', error.message);
    res.status(500).json({
      message: 'Error updating restaurant',
      error: error.message,
    });
  }
};

//================================================================
// to show all the restaurants
//================================================================

export const allRestaurants = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 20; // Number of restaurants per page
    const skip = (page - 1) * limit;

    // Get search query from request
    const searchQuery = req.query.search || '';

    // Create a search filter
    const searchFilter = searchQuery
      ? { restaurantName: { $regex: searchQuery, $options: 'i' } }
      : {};

    // Fetch restaurants with pagination, search, and sorting by updatedAt (descending)
    const restaurants = await Restaurant.find(searchFilter)
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1, createdAt: -1 }); // Sort by updatedAt first, then createdAt

    // Count total restaurants matching the search filter
    const totalRestaurants = await Restaurant.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalRestaurants / limit);

    return res.status(200).json({
      currentPage: page,
      totalPages,
      totalRestaurants,
      restaurants,
    });
  } catch (error) {
    console.error('all restaurants controller error:', error.message);
    res.status(500).json({ message: 'Error fetching restaurants' });
  }
};

//================================================================
// to create categories
//================================================================

export const createCategory = async (req, res) => {
  const { restaurantId } = req.params;
  const { categoryName } = req.body;

  if (!categoryName) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const categoryExists = restaurant.categories.some(
      (category) => category.categoryName === categoryName
    );

    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    // Create the new category
    const newCategory = { categoryName, dishes: [] };
    restaurant.categories.push(newCategory);

    // Save the updated restaurant
    await restaurant.save();

    // Get the newly added category (last item in the array)
    const addedCategory = restaurant.categories[restaurant.categories.length - 1];

    res.status(201).json({
      message: 'Category saved successfully',
      categories: restaurant.categories,
      newCategoryId: addedCategory._id // Include the new category's ID
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//================================================================
//all categories inside a retaurant
//================================================================

export const allCategories = async (req, res) => {
  const { restaurantId } = req.params; // Assuming restaurantId is passed in params

  try {
    // Fetch the restaurant by ID
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Return the categories associated with the restaurant
    res.status(200).json({
      message: 'Categories fetched successfully',
      categories: restaurant.categories,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//================================================================
//edit category
//================================================================

export const editCategory = async (req, res) => {
  const { restaurantId, categoryId } = req.params; // Assuming categoryId is passed in params
  const { newCategoryName } = req.body;

  if (!newCategoryName) {
    return res.status(400).json({ message: 'New category name is required' });
  }

  try {
    // Fetch the restaurant by ID
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Locate the category by ID
    const category = restaurant.categories.find(
      (cat) => cat._id.toString() === categoryId
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if another category already has the new name
    const nameExists = restaurant.categories.some(
      (cat) =>
        cat._id.toString() !== categoryId &&
        cat.categoryName === newCategoryName
    );

    if (nameExists) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    // Update the category's name
    category.categoryName = newCategoryName;

    // Save the restaurant with the updated category
    await restaurant.save();

    res.status(200).json({
      message: 'Category updated successfully',
      categories: restaurant.categories,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

///================================================================
//create sybcategories
//=================================================================

export const createSubCategory = async (req, res) => {
  try {
    const { restaurantId, categoryId } = req.params;
    console.log(restaurantId);
    
    console.log(categoryId);
    
    const { subCategoryName } = req.body;

    // Validate inputs
    if (!subCategoryName) {
      return res.status(400).json({ message: 'Subcategory name is required' });
    }

    // Find the restaurant by ID
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Find the specific category
    const category = restaurant.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Initialize subCategories if it doesn't exist
    if (!category.subCategories) {
      category.subCategories = [];
    }

    // Check if subcategory already exists
    const subCategoryExists = category.subCategories.some(
      (subCategory) => subCategory.subCategoryName === subCategoryName
    );
    if (subCategoryExists) {
      return res.status(400).json({ message: 'Subcategory already exists' });
    }

    // Create a new subcategory
    const newSubCategory = {
      subCategoryName,
      dishes: [], // Initialize with an empty dishes array
    };

    // Add the new subcategory to the category
    category.subCategories.push(newSubCategory);

    // Save the updated restaurant document
    await restaurant.save();

    res.status(201).json({
      message: 'Subcategory created successfully',
      subCategory: category.subCategories[category.subCategories.length - 1], // Return the newly added subcategory
    });
  } catch (error) {
    console.error('Error in createSubCategory:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

//================================================================
//edit sub category
//================================================================

export const editSubCategory = async (req, res) => {
  try {
    const { restaurantId, categoryId, subCategoryId } = req.params;
    const { subCategoryName } = req.body;

    // Validate inputs
    if (!subCategoryName) {
      return res.status(400).json({ message: 'Subcategory name is required' });
    }

    // Find the restaurant by ID
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Find the specific category
    const category = restaurant.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Find the specific subcategory
    const subCategory = category.subCategories.id(subCategoryId);
    if (!subCategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    // Update the subcategory name
    subCategory.subCategoryName = subCategoryName;

    // Save the updated restaurant document
    await restaurant.save();

    res.status(200).json({
      message: 'Subcategory updated successfully',
      subCategory,
    });
  } catch (error) {
    console.error('Error in editSubCategory:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

//================================================================
//create a new dish
//================================================================

export const createDish = async (req, res) => {
  const { categoryId, subCategoryId } = req.params;
  const {
    dishName,
    description,
    servingInfos, // Array of serving info objects
  } = req.body;

  // Validate required fields
  if (
    !dishName ||
    !servingInfos ||
    !Array.isArray(servingInfos) ||
    servingInfos.length === 0
  ) {
    return res
      .status(400)
      .json({ message: 'Dish name and serving information are required' });
  }

  try {
    // Find the restaurant containing the category
    const restaurant = await Restaurant.findOne({
      'categories._id': categoryId,
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Find the specific category
    const category = restaurant.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    let target = category;

    // If subCategoryId is provided, find the subcategory
    if (subCategoryId) {
      const subCategory = category.subCategories.id(subCategoryId);
      if (!subCategory) {
        return res.status(404).json({ message: 'Subcategory not found' });
      }
      target = subCategory;
    }

    // Initialize dishes array if not present
    if (!target.dishes) {
      target.dishes = [];
    }

    // Check if a dish with the same name already exists
    const dishExists = target.dishes.some((dish) => dish.dishName === dishName);

    if (dishExists) {
      return res.status(400).json({
        message: 'Dish with the same name already exists',
      });
    }

    // Create the new dish
    const newDish = {
      dishName,
      description,
      servingInfos: servingInfos.map((info) => ({
        servingInfo: {
          size: info.size,
          price: info.price,
          nutritionFacts: {
            calories: { value: info.nutritionFacts.calories, unit: 'kcl' },
            protein: { value: info.nutritionFacts.protein, unit: 'g' },
            carbs: { value: info.nutritionFacts.carbs, unit: 'g' },
            totalFat: { value: info.nutritionFacts.totalFat, unit: 'g' },
          },
        },
      })),
    };

    // Add the dish to the target (category or subcategory)
    target.dishes.push(newDish);

    // Save the updated restaurant document
    await restaurant.save();

    res.status(201).json({
      message: 'Dish created successfully',
      dish: target.dishes[target.dishes.length - 1], // Return the newly added dish
    });
  } catch (error) {
    console.error('Error in createDish:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

//================================================================
//list of all dishes of a restaurant
//================================================================

export const allDishes = async (req, res) => {
  const { restaurantId } = req.params;
  console.log('Restaurant ID:', restaurantId); // Debugging log

  if (!restaurantId) {
    return res.status(400).json({ message: 'Restaurant ID is required' });
  }

  try {
    // Find the restaurant by ID
    const restaurant = await Restaurant.findById(restaurantId);
    console.log('Restaurant object:', restaurant);
    console.log('Restaurant Name:', restaurant.restaurantName);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const categories = [];

    restaurant.categories.forEach((category) => {
      const subCategories =
        category.subCategories && Array.isArray(category.subCategories)
          ? category.subCategories.map((subCategory) => ({
              subCategoryId: subCategory._id,
              subCategoryName: subCategory.subCategoryName,
            }))
          : [];

      categories.push({
        categoryId: category._id,
        categoryName: category.categoryName,
        subCategories: subCategories,
      });
    });

    const dishes = [];
    restaurant.categories.forEach((category) => {
      if (category?.dishes && Array.isArray(category.dishes)) {
        category.dishes.forEach((dish) => {
          dishes.push({
            ...dish.toObject(),
            restaurantName: restaurant.restaurantName,
            categoryId: category._id,
            categoryName: category.categoryName,
            subCategoryName: null,
          });
        });
      }

      if (category?.subCategories && Array.isArray(category.subCategories)) {
        category.subCategories.forEach((subCategory) => {
          if (subCategory?.dishes && Array.isArray(subCategory.dishes)) {
            subCategory.dishes.forEach((dish) => {
              dishes.push({
                ...dish.toObject(),
                restaurantName: restaurant.restaurantName,
                categoryId: category._id,
                categoryName: category.categoryName,
                subCategoryId: subCategory._id,
                subCategoryName: subCategory.subCategoryName,
              });
            });
          }
        });
      }
    });

    // Sort dishes by updatedAt (most recent first)
    dishes.sort((a, b) => {
      const dateA = new Date(a.updatedAt);
      const dateB = new Date(b.updatedAt);
      return dateB - dateA; // Descending order
    });

    if (dishes.length === 0) {
      return res.status(200).json({
        message: 'No dishes found for this restaurant',
        restaurant: {
          id: restaurant._id,
          name: restaurant.restaurantName, // Explicitly set name here
        },
        dishes,
        categories,
      });
    }

    // Return the fetched dishes along with restaurant info
    res.status(200).json({
      message: 'Dishes fetched successfully',
      restaurant: {
        id: restaurant._id,
        name: restaurant.restaurantName, // Explicitly set name here
      },
      dishes,
      categories,
    });
  } catch (error) {
    console.error('Error fetching dishes:', error.message);
    res.status(500).json({ error: 'Server error while fetching dishes' });
  }
};

//================================================================
// To search for restaurants
//================================================================

export const deleteDish = async (req, res) => {
  const { restaurantId, categoryId, subCategoryId } = req.params;
  const { dishId, deleteId } = req.body;

  // Validate deleteId
  const secretId = 'delete';
  if (!deleteId || deleteId !== secretId) {
    return res.status(400).json({ message: 'Invalid delete ID' });
  }

  // Validate dishId
  if (!dishId) {
    return res.status(400).json({ message: 'Dish ID is required' });
  }

  try {
    // Find the restaurant by restaurantId
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Find the category within the restaurant
    const category = restaurant.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    let target = category;

    // If subCategoryId is provided, find the subcategory
    if (subCategoryId) {
      const subCategory = category.subCategories.id(subCategoryId);
      if (!subCategory) {
        return res.status(404).json({ message: 'Subcategory not found' });
      }
      target = subCategory;
    }

    // Find the dish within the target (category or subcategory)
    const dish = target.dishes.id(dishId);
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    // Remove the dish from the target (category or subcategory)
    target.dishes.pull(dishId);

    // Save the updated restaurant document
    await restaurant.save();

    return res.status(200).json({
      message: 'Dish deleted successfully',
      dishId,
    });
  } catch (error) {
    console.error('Delete dish controller error:', error.message);
    res.status(500).json({
      message: 'Error deleting dish',
      error: error.message,
    });
  }
};

export const searchRestaurant = async (req, res) => {
  const { query } = req.query; // query parameter passed by the user

  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    // Search by restaurant name, category name, or dish name
    const restaurant = await Restaurant.find({
      $or: [
        { restaurantName: { $regex: query, $options: 'i' } }, // Case-insensitive match on restaurant name
        // { 'categories.name': { $regex: query, $options: 'i' } }, // Case-insensitive match on category name
        // { 'categories.dishes.name': { $regex: query, $options: 'i' } }, // Case-insensitive match on dish name
      ],
    });

    if (restaurant.length === 0) {
      return res.status(404).json({ message: 'No matching restaurants found' });
    }

    return res.status(200).json({ restaurant });
  } catch (error) {
    console.log('search restaurant controller error: ', error.message);
    return res.status(500).json({
      message: 'Error searching for restaurants',
      error: error.message,
    });
  }
};

//================================================================
//search dihes
//================================================================

// export const searchDish = async (req, res) => {
//   const { restaurantId } = req.params;  // restaurantId passed as URL parameter
//   const { query } = req.query;  // search query passed by the user

//   if (!query) {
//     return res.status(400).json({ message: 'Search query is required' });
//   }

//   try {
//     // Find the restaurant by its ID
//     const restaurant = await Restaurant.findById(restaurantId);

//     if (!restaurant) {
//       return res.status(404).json({ message: 'Restaurant not found' });
//     }

//     // Search inside the restaurant's categories, subcategories, and dishes
//     const result = restaurant.categories.reduce((acc, category) => {
//       // Search in category name
//       if (category.categoryName.toLowerCase().includes(query.toLowerCase())) {
//         acc.push({ categoryName: category.categoryName, matches: category.dishes });
//       }

//       category.subCategories.forEach((subCategory) => {
//         // Search in subcategory name
//         if (subCategory.subCategoryName.toLowerCase().includes(query.toLowerCase())) {
//           acc.push({
//             categoryName: category.categoryName,
//             subCategoryName: subCategory.subCategoryName,
//             matches: subCategory.dishes,
//           });
//         }

//         subCategory.dishes.forEach((dish) => {
//           // Search in dish name
//           if (dish.dishName.toLowerCase().includes(query.toLowerCase())) {
//             acc.push({
//               categoryName: category.categoryName,
//               subCategoryName: subCategory.subCategoryName,
//               dishName: dish.dishName,
//               description: dish.description,
//               servingInfo: dish.servingInfo,
//               nutritionFacts: dish.nutritionFacts,
//             });
//           }
//         });
//       });

//       return acc;
//     }, []);

//     if (result.length === 0) {
//       return res.status(404).json({ message: 'No matching dishes found in this restaurant' });
//     }

//     return res.status(200).json({ results: result });
//   } catch (error) {
//     console.error('Error searching dishes in restaurant:', error.message);
//     return res.status(500).json({
//       message: 'Error searching for dishes in restaurant',
//       error: error.message,
//     });
//   }
// };

export const searchDish = async (req, res) => {
  const { restaurantId } = req.params; // restaurantId passed as URL parameter
  const { query } = req.query; // search query passed by the user

  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    // Find the restaurant by its ID
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Search inside the restaurant's categories, subcategories, and dishes
    const result = restaurant.categories.reduce((acc, category) => {
      // Search in category name
      if (category.categoryName.toLowerCase().includes(query.toLowerCase())) {
        acc.push({
          categoryName: category.categoryName,
          matches: category.dishes,
        });
      }

      // Check if subCategories exist and iterate through them
      category.subCategories?.forEach((subCategory) => {
        // Search in subcategory name
        if (
          subCategory.subCategoryName
            .toLowerCase()
            .includes(query.toLowerCase())
        ) {
          acc.push({
            categoryName: category.categoryName,
            subCategoryName: subCategory.subCategoryName,
            matches: subCategory.dishes,
          });
        }

        // Check if dishes exist in the subcategory and search them
        subCategory.dishes?.forEach((dish) => {
          // Search in dish name
          if (dish.dishName.toLowerCase().includes(query.toLowerCase())) {
            acc.push({
              categoryName: category.categoryName,
              subCategoryName: subCategory.subCategoryName,
              dishName: dish.dishName,
              description: dish.description,
              servingInfo: dish.servingInfo,
              nutritionFacts: dish.nutritionFacts,
            });
          }
        });
      });

      // Check if dishes exist in the category and search them
      category.dishes?.forEach((dish) => {
        // Search in dish name
        if (dish.dishName.toLowerCase().includes(query.toLowerCase())) {
          acc.push({
            categoryName: category.categoryName,
            dishName: dish.dishName,
            description: dish.description,
            servingInfo: dish.servingInfo,
            nutritionFacts: dish.nutritionFacts,
          });
        }
      });

      return acc;
    }, []);

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: 'No matching dishes found in this restaurant' });
    }

    return res.status(200).json({ results: result });
  } catch (error) {
    console.error('Error searching dishes in restaurant:', error.message);
    return res.status(500).json({
      message: 'Error searching for dishes in restaurant',
      error: error.message,
    });
  }
};

//================================================================
// Get total number of restaurants
//================================================================

export const totalRestaurants = async (req, res) => {
  try {
    // Count the total number of restaurants in the collection
    const count = await Restaurant.countDocuments();
    console.log(count);

    return res.status(200).json({
      message: 'Total number of restaurants fetched successfully',
      totalRestaurants: count,
    });
  } catch (error) {
    console.error('totalRestaurants error: ', error.message);
    res.status(500).json({
      message: 'Error fetching total restaurants',
      error: error.message,
    });
  }
};

//================================================================
//total number of dishes
//================================================================

export const totalDishes = async (req, res) => {
  try {
    // Fetch all restaurants
    const restaurants = await Restaurant.find();

    // Calculate the total number of dishes
    let totalDishes = 0;

    restaurants.forEach((restaurant) => {
      restaurant.categories.forEach((category) => {
        // Count dishes in the category
        if (category.dishes) {
          totalDishes += category.dishes.length;
        }

        // Count dishes in the subcategories
        if (category.subCategories) {
          category.subCategories.forEach((subCategory) => {
            if (subCategory.dishes) {
              totalDishes += subCategory.dishes.length;
            }
          });
        }
      });
    });

    console.log('Total Dishes:', totalDishes);

    return res.status(200).json({
      message: 'Total number of dishes fetched successfully',
      totalDishes,
    });
  } catch (error) {
    console.error('Error in totalDishes:', error.message);
    res
      .status(500)
      .json({ message: 'Error fetching total dishes', error: error.message });
  }
};
