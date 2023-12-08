const bcrypt = require("bcrypt");
const Product = require("../model/productSchema");
const User = require("../model/userSchema");
// const cookieParser = require("cookie-parser");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../model/paymentSchema");
const Contact = require("../model/contactSchema");
const Order = require("../model/orderSchema");
const Cart = require("../model/cartSchema");

// Get all products data
const getAllProducts = async (req, res) => {
  const productsData = await Product.find({});
  res.status(200).send(productsData);
};

// Get filtered products data
const filterProducts = async (req, res) => {
  const { brand } = req.body;
  if (brand === "all") {
    const allData = await Product.find({});
    return res.status(200).send(allData);
  }
  const filterData = await Product.find({ category: brand });
  res.status(200).send(filterData);
};

// Get single product
const getSingleProduct = async (req, res) => {
  const { id } = req.body;
  const singleProduct = await Product.findOne({ id: id });
  res.status(200).send(singleProduct);
};
// Register
const registerUser = async (req, res) => {
  const { name, email, phone, password, cpassword } = req.body;
  if (!name || !email || !phone || !password || !cpassword) {
    return res.status(404).json({ error: "Plz filled the field properly" });
  }

  try {
    const userExist = await User.findOne({ email: email });

    if (userExist) {
      return res.status(422).json({ error: "Email already Exist" });
    }

    const user = new User({ name, email, phone, password, cpassword });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.log(err);
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    let token;
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({ error: "Please fill the data" });
    }

    const userLogin = await User.findOne({ email: email });

    if (userLogin) {
      const isMatch = await bcrypt.compare(password, userLogin.password);
      token = await userLogin.generateAuthToken();

      // res.cookie("jwtoken", token, {
      //   expires: new Date(Date.now() + 2 * 60 * 60 * 1000),
      //   httpOnly: true,
      // });

      if (!isMatch) {
        res.status(400).json({ error: "Invalid Credientials pass" });
      } else {
        res.send(userLogin);
      }
    } else {
      res.status(400).json({ error: "Invalid Credientials" });
    }
  } catch (err) {
    console.log(err);
  }
};

// Contact Us
const contactUs = async (req, res) => {
  const { name, email, message } = req.body;
  const contact = new Contact({ name, email, message });
  await contact.save();
  res.status(200).json({ msg: "User Contact Successfully" });
};

// post cart items
const postCartItems = async (req, res) => {
  const { name, email, phone, cartItem } = req.body;

  // check if there is any existing item in the cart
  let existingCart = await Cart.findOne({ email: email });

  if (!existingCart) {
    const newCart = new Cart({
      name,
      email,
      phone,
      cart: cartItem,
    });

    await newCart.save();
  } else {
    existingCart.cart = existingCart.cart.concat(cartItem);
    await existingCart.save();
  }

  res.status(200).send("Successfully Added to the Cart");
};

// get cart items
const getCartItems = async (req, res) => {
  try {
    const { email } = req.body;
    const cartItems = await Cart.findOne({ email: email });

    if (!cartItems) {
      return res.status(404).json({ message: "No cart items found" });
    }

    res.status(200).send(cartItems);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// remove cart items
const removeCartItem = async (req, res) => {
  const { email, id } = req.body;
  try {
    const result = await Cart.updateOne(
      { email: email },
      { $pull: { cart: { id } } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Item removed successfully" });
    } else {
      res.status(404).json({ message: "Item not found or not removed" });
    }
  } catch (error) {
    console.error("Error removing cart item:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
// post ordered items
const postOrderedItems = async (req, res) => {
  const { name, email, phone, amount, shippingAddress, cart } = req.body;

  // checking if there is an existing order with the same email
  let existingOrder = await Order.findOne({ email: email });

  if (!existingOrder) {
    // if no existing order found create a new order
    const newOrder = new Order({
      name,
      email,
      phone,
      amount,
      shippingDetails: {
        address: shippingAddress.address,
        city: shippingAddress.city,
        pincode: shippingAddress.pincode,
        state: shippingAddress.state,
        contact: shippingAddress.phone,
      },
      order: cart,
    });
    await newOrder.save();
  } else {
    // If the existing order is found append the new order with the existing order
    existingOrder.order = existingOrder.order.concat(cart);
    existingOrder.amount += amount;
    await existingOrder.save();
  }

  res.status(200).send("Order saved successfully");
};

// get ordered items
const getOrderedItems = async (req, res) => {
  try {
    const { email } = req.body;
    const orderedItems = await Order.findOne({ email: email });

    if (!orderedItems) {
      return res.status(404).json({ message: "No ordered items found" });
    }
    res.status(200).send(orderedItems);
  } catch (error) {
    console.error("Error fetching ordered items:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Help & Support
const supportUser = async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !phone || !message) {
    return res.status(204).json({ error: "plzz fill the support form" });
  }

  const userContact = await User.findOne({ email: email });

  if (userContact) {
    const userMessage = await userContact.addMessage(
      name,
      email,
      phone,
      message
    );
    await userContact.save();
    res.status(201).json({ message: "Message sent successfully" });
  }
};

// Razorpay Payment Integration
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

const payment = async (req, res) => {
  const options = {
    amount: Number(req.body.amount * 100), // amount in the smallest currency unit
    currency: "INR",
  };
  const order = await instance.orders.create(options);
  res.status(200).json({
    success: true,
    order,
  });
};

const paymentVerification = async (req, res) => {
  const {
    name,
    email,
    phone,
    amount,
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
  } = req.body;
  // verify payment signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(body.toString())
    .digest("hex");

  const isSignatureValid = generatedSignature == razorpay_signature;

  if (isSignatureValid) {
    // Save in the database
    await Payment.create({
      name,
      email,
      phone,
      amount,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    });

    res.status(200).json({ success: "true" });
  } else {
    res.status(400).json({ success: "false" });
  }
};

module.exports = {
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
};
