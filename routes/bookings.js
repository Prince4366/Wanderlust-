const express = require("express");
const router = express.Router({ mergeParams: true });
const Booking = require("../models/bookings");
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


router.post("/", isLoggedIn, async (req, res) => {
    const {
        guestName,
        email,
        phone,
        address,
        checkIn,
        checkOut
    } = req.body;
    const listing = await Listing.findById(req.params.id);

    // 🔴 Check for overlapping bookings
    const conflict = await Booking.findOne({
        listing: listing._id,
        $or: [
            { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }
        ]
    });

    if (conflict) {
        req.flash("error", "Dates already booked!");
        return res.redirect(`/listings/${listing._id}`);
    }
       const days = Math.ceil(
        (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );

    const booking = new Booking({
        listing: listing._id,
        user: req.user._id,
        checkIn,
        checkOut,
        totalPrice: days * listing.price
    });

    const amount = days * listing.price * 100; // paise

    const order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: `receipt_${Date.now()}`
    });

    res.json({
        orderId: order.id,
        amount: order.amount,
        key: process.env.RAZORPAY_KEY_ID
    });
    await booking.save();
    req.flash("success", "Booking Confirmed!");
    res.redirect("/bookings");
});
router.post("/payment/success", isLoggedIn, async (req, res) => {
    const {
        razorpay_payment_id,
        bookingData
    } = req.body;

    const booking = new Booking({
        ...bookingData,
        user: req.user._id,
        paymentId: razorpay_payment_id,
        paymentStatus: "paid"
    });

    await booking.save();
    res.sendStatus(200);
});



router.get("/", isLoggedIn, async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing");
    res.render("bookings/index", { bookings });
});


module.exports = router;
