import mongoose from 'mongoose';

//serving info schema
const servingInfoShema = new mongoose.Schema(
  {
    servingInfo: {
      size: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: false,
      },
      nutritionFacts: {
        calories: {
          value: {
            type: Number,
            required: true,
          },
          unit: {
            type: String,
            default: 'kcl',
          },
        },
        protein: {
          value: {
            type: Number,
            required: true,
          },
          unit: {
            type: String,
            default: 'g',
          },
        },
        carbs: {
          value: {
            type: Number,
            required: true,
          },
          unit: {
            type: String,
            default: 'g',
          },
        },
        totalFat: {
          value: {
            type: Number,
            required: true,
          },
          unit: {
            type: String,
            default: 'g',
          },
        },
      },
    },
  },
  { timestamps: true }
);

// Dish Schema
const dishSchema = new mongoose.Schema(
  {
    dishName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    servingInfos : [servingInfoShema]
  },
  { timestamps: true }
);

// Sub Category

const subCategorySchema = new mongoose.Schema(
  {
    subCategoryName: {
      type: String,
      required: true,
    },
    dishes: [dishSchema],
  },
  { timestamps: true }
);

// Category Schema
const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
    },
    subCategories: {
      type: [subCategorySchema],
      default: undefined,
    },
    dishes: {
      type: [dishSchema],
      default: undefined,
    },
  },
  { timestamps: true }
);

// Restaurant Schema
const restaurantSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    description: {},
    categories: [categorySchema], // Array of categories within a restaurant
  },
  { timestamps: true }
);

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;
