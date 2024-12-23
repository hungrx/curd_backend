import express, { Router } from 'express';
import {
  allCategories,
  allDishes,
  allRestaurants,
  countDishesInRestaurant,
  createCategory,
  createDish,
  createRestaurant,
  createSubCategory,
  deleteDish,
  deleteRestaurant,
  editDish,
  editRestaurant,
  searchDish,
  searchRestaurant,
  totalDishes,
  totalRestaurants,
} from '../controllers/restaurant.controller.js';
import { uploadRestaurantLogo } from '../middlewares/restaurantLogo.middleware.js';

const routes = express.Router();

// Route Definitions in Alphabetical Order
routes.get('/allDishes/:restaurantId', allDishes); // Get all dishes for a restaurant
routes.get('/allRestaurants', allRestaurants); // Get all restaurants
routes.get('/allCategories/:restaurantId', allCategories)
routes.put('/createCategory/:restaurantId', createCategory); // Create a new category in a restaurant
routes.put('/createDish/:categoryId', createDish); // Create a dish in a category
routes.put('/createDish/:categoryId/:subCategoryId', createDish);  // Route for creating a dish in a subcategory
routes.post('/createRestaurant', uploadRestaurantLogo, createRestaurant); // Create a new restaurant
routes.put('/createSubcategory/:restaurantId/:categoryId', createSubCategory); // Create a subcategory within a category
routes.delete('/deleteRestaurant/:restaurantId', deleteRestaurant); // Delete a restaurant
routes.put('/editRestaurant/:restaurantId', uploadRestaurantLogo, editRestaurant); // Edit restaurant details
routes.get('/searchRestaurants', searchRestaurant); // Search for restaurants
routes.get('/totalDishes', totalDishes); // Get the total number of dishes
routes.get('/totalRestaurants', totalRestaurants); // Get the total number of restaurants
routes.get('/searchDish/:restaurantId', searchDish);
routes.delete('/deleteDish/:restaurantId/:dishId', deleteDish);
routes.put('/editDish/:dishId/:categoryId', editDish);
routes.put('/editDish/:dishId/:categoryId/:subCategoryId', editDish);
routes.get('/dishCount/:restaurantId', countDishesInRestaurant);


export default routes;
