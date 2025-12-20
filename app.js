if(process.env.NODE_ENV!="production"){
    require("dotenv").config();
}

const express=require("express");
const app=express();
const mongoose=require("mongoose");
const wrapAsync=require("./utils/wrapAsync.js");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore=require("connect-mongo").default;
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");
const userRouter=require("./routes/user.js");

const listingsRouter=require("./routes/listing.js");
const reviewsRouter=require("./routes/review.js");



// const MONGO_URL='mongodb://127.0.0.1:27017/wanderlust';
const dbUrl=process.env.ATLASDB_URL;
main()
    .then(()=>{
        console.log("connect to DB");
    })
    .catch((err)=>{
        console.log(err);
    });
async function main() {
  await mongoose.connect(dbUrl);
}
app.engine('ejs', ejsMate);
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"/views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600,
});

store.on("error",(err)=>{
    console.log("ERROR IN MONGODB SESSION",err);
});
const sessionOptions={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false,
    cookie:{
            expires:Date.now()+7*24*60*60*1000,
            maxAge:7*24*60*60*1000,
            httpOnly:true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
});

// app.get("/demouser",async(req,res)=>{
//     let fakeUser=new User({
//         email:"student@gmail.com",
//         username:"delta-student",
//     });
//     let registeredUser=await User.register(fakeUser,"helloworld!");
//     res.send(registeredUser);
// });

// app.get("/",(req,res)=>{
//     res.send("it is working!");
// });
// to send cookie res.cookie(key,value);
// const validateListing=(req,res,next)=>{
//     let {error}=listingSchema.validate(req.body);
//     if(error){
//         let errMsg=error.details.map((el)=>el.message).join(",");
//         throw new ExpressError(400,error);
//     }else{
//         next();
//     }
// };

// const validateReview=(req,res,next)=>{
//     let {error}=reviewSchema.validate(req.body);
//     if(error){
//         let errMsg=error.details.map((el)=>el.message).join(",");
//         throw new ExpressError(400,error);
//     }else{
//         next();
//     }
// };

// // index route
// app.get("/listings",wrapAsync(async (req,res)=>{
//      const allListings=await Listing.find({});
//      res.render("listings/index",{allListings});
// }));

// // new route
// app.get("/listings/new",(req,res)=>{
//     res.render("listings/new.ejs");
// });
// // Show route
// app.get("/listings/:id",wrapAsync(async (req,res)=>{
//     let{id}=req.params;
//     const listing=await Listing.findById(id).populate("reviews");
//     res.render("listings/show.ejs",{listing});
// }));
// // create route

// app.post("/listings",validateListing,wrapAsync(async(req,res,next)=>{
//     const newlisting=new Listing(req.body.listing);
//     await newlisting.save();
//     res.redirect("/listings"); 
// }));

// //edit route
// app.get("/listings/:id/edit",wrapAsync(async(req,res)=>{
//     let {id}=req.params;
//     const listing=await Listing.findById(id);
//     res.render("listings/edit.ejs",{listing});
// }));

// //update route
// app.put("/listings/:id",validateListing,wrapAsync(async(req,res)=>{
//     let {id}=req.params;
//     await Listing.findByIdAndUpdate(id,{...req.body.listing});
//     res.redirect(`/listings/${id}`);
// }));

app.use("/listings",listingsRouter);
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/",userRouter);

// //delete route
// app.delete("/listings/:id",wrapAsync(async(req,res)=>{
//     let {id}=req.params;
//     const deletedlisting=await Listing.findByIdAndDelete(id);
//     console.log(deletedlisting);
//     res.redirect("/listings");
// }));

// //POST route. Review

// app.post("/listings/:id/reviews",validateReview,wrapAsync(async (req,res)=>{
//     let listing=await Listing.findById(req.params.id);
//     let newReview=new Review(req.body.review);

//     listing.reviews.push(newReview);

//     await newReview.save();
//     await listing.save();

//     res.redirect(`/listings/${listing._id}`);
// }));

// //Delete rote Review

// app.delete("/listings/:id/reviews/:reviewId",wrapAsync(async(req,res)=>{
//     let{id,reviewId}=req.params;

//     await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
//     await Review.findByIdAndDelete(reviewId);

//     res.redirect(`/listings/${id}`);
// })
// );


// app.get("/testListing",async (req,res)=>{
//     let sampleListing=new Listing({
//          title:"my new villlage",
//          description:"by the beach",
//          price:1200,
//          location:"paris",
//          country:"frace"
//       });
//      await sampleListing.save();
//      console.log("sample was saved!");
//      res.send("successful testing");
//  });

app.use((req,res,next)=>{
    next(new ExpressError(404,"page not found"));
});

app.use((err,req,res,next)=>{
    let {statusCode=500,message="something went wrong!"}=err;
    res.status(statusCode).render("error.ejs",{message});
    // res.status(statusCode).send(message);
});
app.listen(8080,()=>{
    console.log("port s listening on 8080");
});