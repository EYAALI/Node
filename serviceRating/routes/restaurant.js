const express = require('express');
const Restaurant = require('../models/restaurant'); // Ensure the correct path to your model
const router = express.Router();
const multer = require('multer');
const path = require('path');


// Set up multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images'); // Store images in the "public/images" directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use current timestamp as filename
  }
});
const upload = multer({ storage });

// List all restaurants
router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.render('index', { restaurants });
  } catch (err) {
    console.error('Error fetching restaurants:', err);
    res.status(500).send('Error fetching restaurants.');
  }
});

// Route to show the form for adding a new restaurant
router.get('/new', (req, res) => {
    res.render('new');  // Render the view for creating a new restaurant
  });
  

// Add a new restaurant (with image upload)
router.post('/new', upload.single('image'), async (req, res) => {
  const { name, address, cuisine, phone, rating, openingHours , latitude, longitude} = req.body;
  const image = req.file ? '/images/' + req.file.filename : ''; // Handle image path

  if (!name || !address || !cuisine || !phone || !openingHours) {
    return res.status(400).send('All fields are required.');
  }

  const restaurant = new Restaurant({
    name,
    address,
    cuisine,
    phone,
    rating,
    openingHours,
    image
  });

  try {
    await restaurant.save();
    res.redirect('/restaurants');
  } catch (err) {
    console.error('Error creating the restaurant:', err);
    res.status(500).send('Error creating the restaurant.');
  }
});

// Edit restaurant form
router.get('/:id/edit', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).send('Restaurant not found.');
    }
    res.render('edit', { restaurant });
  } catch (err) {
    console.error('Error fetching the restaurant for editing:', err);
    res.status(500).send('Error fetching the restaurant.');
  }
});

// Update a restaurant (with image upload)
router.post('/:id/edit', upload.single('image'), async (req, res) => {
  const { name, address, cuisine, phone, rating, openingHours } = req.body;
  const image = req.file ? '/images/' + req.file.filename : ''; // Handle image path

  try {
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      {
        name,
        address,
        cuisine,
        phone,
        rating,
        openingHours,
        image
      },
      { new: true, runValidators: true }
    );

    if (!updatedRestaurant) {
      return res.status(404).send('Restaurant not found.');
    }
    res.redirect('/restaurants');
  } catch (err) {
    console.error('Error updating the restaurant:', err);
    res.status(500).send('Error updating the restaurant.');
  }
});

// Delete a restaurant
router.post('/:id/delete', async (req, res) => {
  try {
    const deletedRestaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!deletedRestaurant) {
      return res.status(404).send('Restaurant not found.');
    }
    res.redirect('/restaurants');
  } catch (err) {
    console.error('Error deleting the restaurant:', err);
    res.status(500).send('Error deleting the restaurant.');
  }
});

// Rate a Restaurant
router.post('/:id/rate', async (req, res) => {
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).send('Rating must be between 1 and 5.');
  }

  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).send('Restaurant not found.');

    restaurant.ratings.push(rating);
    await restaurant.save();

    res.redirect('/restaurants');
  } catch (err) {
    res.status(500).send('Error updating restaurant rating.');
  }
});

// Route to fetch restaurant details
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).send('Restaurant not found.');
    }
    res.render('details', { restaurant });
  } catch (err) {
    console.error('Error fetching restaurant details:', err);
    res.status(500).send('Error fetching restaurant details.');
  }
});

// Top-rated Restaurants
router.get('/top-rated', async (req, res) => {
  try {
    const topRestaurants = await Restaurant.find()
      .sort({ rating: -1 })
      .limit(5);
    res.render('details', { topRestaurants });
  } catch (err) {
    console.error('Error fetching top-rated restaurants:', err);
    res.status(500).send('Error fetching top-rated restaurants.');
  }
});

// Analytics for Ratings
router.get('/analytics/ratings', async (req, res) => {
  try {
    const ratingsData = await Restaurant.aggregate([
      {
        $project: {
          name: 1,
          averageRating: { $avg: '$ratings' },
          ratingsCount: { $size: '$ratings' }
        }
      },
      { $sort: { averageRating: -1 } },
      { $limit: 5 }
    ]);

    res.render('ratings', { ratingsData });
  } catch (err) {
    console.error('Error fetching ratings analytics:', err);
    res.status(500).send('Error fetching ratings analytics.');
  }
});

// Add a comment to a restaurant
router.post('/:id/comment', async (req, res) => {
    const { username, comment } = req.body;
  
    if (!username || !comment) {
      return res.status(400).send('Username and comment are required.');
    }
  
    try {
      const restaurant = await Restaurant.findById(req.params.id);
      if (!restaurant) return res.status(404).send('Restaurant not found.');
  
      restaurant.comments.push({ username, comment });
      await restaurant.save();
  
      res.redirect(`/restaurants/${req.params.id}`);
    } catch (err) {
      res.status(500).send('Error adding comment.');
    }
  });

  // Like a restaurant
router.post('/:id/like', async (req, res) => {
    try {
      const restaurant = await Restaurant.findById(req.params.id);
      if (!restaurant) return res.status(404).send('Restaurant not found.');
  
      restaurant.likes += 1;
      await restaurant.save();
  
      res.redirect(`/restaurants/${req.params.id}`);
    } catch (err) {
      res.status(500).send('Error liking restaurant.');
    }
  });
  

module.exports = router;
