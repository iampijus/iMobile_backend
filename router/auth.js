const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  filterProducts,
  getSingleProduct,
  registerUser,
  loginUser,
  contactUs,
  postCartItems,
  getCartItems,
  removeCartItem,
  postOrderedItems,
  getOrderedItems,
  supportUser,
  payment,
  paymentVerification,
} = require("../controllers/controllers");

require("../db/connection");

router.get("/", (req, res) => {
  res.send("This is the home page");
});
// Get products data
router.get("/products", getAllProducts);
// Get filtered products data
router.post("/filterproducts", filterProducts);
// Get single Product
router.post("/singleproduct", getSingleProduct);
// Register
router.post("/signup", registerUser);

// Login route
router.post("/signin", loginUser);

// Contact Us
router.post("/contactus", contactUs);

// post cart items
router.post("/postcartitems", postCartItems)

// get cart items
router.post("/getcartitems", getCartItems);

// post cart items to delete
router.post("/removecartitem", removeCartItem);
// post ordered items
router.post("/postordereditems", postOrderedItems);

// get order data
router.post("/ordereditems", getOrderedItems);

// Help & Support
router.post("/helpsupport", supportUser);

// Profile
// router.get("/profile", authenticate, myProfile);

// Razorpay payment integration
router.post("/payment", payment);
router.post("/paymentverify", paymentVerification);
router.get("/getkey", (req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_API_KEY });
});

// Logout
// router.get("/logout", (req, res) => {
//   // res.clearCookie("jwtoken", { path: "/" });
//   res.status(200).send("User Logout");
// });

module.exports = router;
