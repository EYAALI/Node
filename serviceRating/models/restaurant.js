const mongoose = require('mongoose');


const restaurantSchema = new mongoose.Schema({
  name: String,
  address: String,
  cuisine: String,
  phone: String,
  rating: { type: Number, default: 0 },
  openingHours: String,
  ratings: [Number],
  image: [String],
  latitude: { type: Number, required: false },
  longitude: { type: Number, required: false },
  comments: [{        // Array of comments
    username: String,
    comment: String,
    date: { type: Date, default: Date.now }
  }],
  likes: { type: Number, default: 0 } 
});



restaurantSchema.methods.getAverageRating = function () {
  if (this.ratings.length === 0) return 0;
  return this.ratings.reduce((sum, rating) => sum + rating, 0) / this.ratings.length;
};

module.exports = mongoose.model('Restaurant', restaurantSchema);
