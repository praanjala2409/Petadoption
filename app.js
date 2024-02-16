const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const res = require('express/lib/response');
const { redirect } = require('express/lib/response');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.json())
mongoose.connect("mongodb://localhost:27017/petadoption");


const Storage = multer.diskStorage({
    destination: function (request, file, callback) {
        callback(null, './public/uploads/');
    },
    filename: function (request, file, callback) {
        callback(null, Date.now() + file.originalname)
    }
})

const upload = multer({
    storage: Storage,
    limits: 1024 * 1024 * 3,
})


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },
    address2: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    zip: {
        type: Number,
        required: true
    },
    role: {
        default: 0
    }
     
});
userSchema.pre("save", function (next) {
    const user = this

    if (this.isModified("password") || this.isNew) {
        bcrypt.genSalt(10, function (saltError, salt) {
            if (saltError) {
                return next(saltError)
            } else {
                bcrypt.hash(user.password, salt, function (hashError, hash) {
                    if (hashError) {
                        return next(hashError)
                    }

                    user.password = hash
                    next()
                })
            }
        })
    } else {
        return next()
    }
})
const adoptSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
       
    },
    address: {
        type: String,
        required: true
    },
    address2: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    zip: {
        type: Number,
        required: true
    },
    animalname: {
        type: String,
        required: true
    },
    id:{
        type:String,
        required:true
    }


});
const animalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    age: Number,
    gender:{
        type:String,
        required:true
    },
    breed:{
        type:String
    },
    
    img: {

        type: String

    },
       
});
const contactSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    query:{
        type:String,
        required:true
    }
});

const catSchema=new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    age: Number,
    gender:{
        type:String,
        required:true
    },
    breed:{
        type:String
    },
     img: {

        type: String
    } 

});

const User = new mongoose.model("User", userSchema);
const Animal = new mongoose.model("Animal", animalSchema);
const Adopt = new mongoose.model("Adoption", adoptSchema);
const Contact=new mongoose.model("Contact",contactSchema);
const Cat= new mongoose.model("Cat",catSchema);


app.get("/", function (req, res) {
    res.render("login")
})
app.post("/", async (req, res) => {
    try {
        const loginUser = req.body.loginuser;
        const loginPassword = req.body.loginpw;
        const user = await User.findOne({ username: loginUser });
        const isMatch = await bcrypt.compare(loginPassword, user.password);

        if (isMatch) {
            if (user.role.default == 1) {
                res.redirect("/dogs");
            } else {
                res.redirect("/home1");
            }
        } else {
            res.redirect("/failure");
        }
    } catch (error) {
        res.redirect("/signup");
    }
});

app.get("/home1", function (req, res) {
    res.render("home1");
});
app.get("/failure", function (req, res) {
    res.render("failure");
})
app.post("/failure", function (req, res) {
    res.redirect("/");
})
app.get("/signup", function (req, res) {
    res.render("signup");
});
app.post("/signup", async (req, res) => {
    
    try {
        const myuser = new User({
            name: req.body.fullname,
            username: req.body.Username,
            password: req.body.pw,
            email: req.body.email,
            address: req.body.ad1,
            address2: req.body.ad2,
            state: req.body.State,
            zip: req.body.pincode,
            role:{
                default:0
            }
        });

        const signed = await myuser.save();

        res.render("home1");
    } catch (error) {
        res.status(400).send(error);
    }

})



app.get("/contact", function (req, res) {
    res.render("contact");

})

app.post("/contact",async(req,res)=>{
    try {
        const mailid=req.body.mail
        const user=await User.findOne({email:mailid})
        const contact=new Contact({
            name:req.body.name,
            phone:req.body.phone,
            email:user.email,
            query:req.body.query
        });
        contact.save();
        res.render("home1")
        
    } catch (error) {
        console.log(error);
    }
})

app.get("/dogs", async (req, res)=> {
    Animal.find({}, function (err, newanimals) {
        if (err) {
            console.log(err);
        } else {
            res.render("dogs", { animals: newanimals })

        }
    })
});
app.get("/userdogs", function (req, res) {
    Animal.find({}, function (err, newanimals) {
        if (err) {
            console.log(err);
        } else {
            res.render("userdogs", { animals: newanimals })

        }
    })
})
app.post("/dogs", upload.single('image'), function (req, res) {
    const animal = new Animal({
        name: req.body.name,
       
        age: req.body.age,
        gender:req.body.gender,
        breed:req.body.breed,
       
        img: req.file.filename,

    })
    animal.save();
    res.redirect("/dogs")
});
app.get("/adoptionform", function (req, res) {
    res.render("adoptionform");
});
app.post("/adoptionform", async (req, res) => {
    try {
       const petname=req.body.animal;
       const mailid=req.body.email;
        const pet = await Animal.findOne({ name: petname });
       const user=await User.findOne({email:mailid})
        const adopt = new Adopt({
            name: req.body.fullname,
            email:user.email,
            address: req.body.ad1,
            address2: req.body.ad2,
            state: req.body.State,
            zip: req.body.pincode,
            animalname:req.body.animal,
            id:pet._id.toString()
        })
        adopt.save();
        res.redirect("/userdogs");


    } catch (error) {
        console.log(error);
    }


});
app.get("/cat",function(req,res)
{
    Cat.find({},function(err,catlist){
    if (err)
    {
        console.log(err)
    }
    else
    {
        res.render("cats",{cats:catlist})
    }
})

   
})

app.get("/usercat",function(req,res)
{
    Cat.find({},function(err,catlist){
    if (err)
    {
        console.log(err)
    }
    else
    {
        res.render("usercats",{cats:catlist})
    }
})

   
})
app.post('/cat',upload.single('image'),function(req,res){
    let cat1=new Cat({
        name: req.body.name,
        age: req.body.age,
        gender:req.body.gender,
        breed:req.body.breed,
        img: req.file.filename
    })
    cat1.save();
    res.redirect("/cat")
})
app.get("/catadoptionform", function (req, res) {
    res.render("adoptcat");
});
app.post("/catadoptionform", async (req, res) => {
    try {
       const petname=req.body.Cat;
       const mailid=req.body.email;
        const pet = await Cat.findOne({ name: petname });
       const user=await User.findOne({email:mailid})
        const adopt = new Adopt({
            name: req.body.fullname,
            email:user.email,
            address: req.body.ad1,
            address2: req.body.ad2,
            state: req.body.State,
            zip: req.body.pincode,
            animalname:req.body.cat,
            id:pet._id.toString()
        })
        adopt.save();
        res.redirect("/usercat");


    } catch (error) {
        console.log(error);
    }


});




app.post('/cat/delete/:id', async (req, res) => {
    const catId = req.params.id;

    try {
        
        const deletedCat = await Cat.findByIdAndDelete(catId);

        if (deletedCat) {
            
            res.redirect("/cats"); 
        } else {
            res.status(404).send("Cat not found");
        }
    } catch (error) {
        console.error('Error deleting cat:', error);
        res.status(500).send("Internal server error");
    }
});
app.post('/dog/delete/:id', async (req, res) => {
    const dogId = req.params.id;

    try {
        
        const deletedDog = await Animal.findByIdAndDelete(dogId);

        if (deletedDog) {
            
            res.redirect("/dogs"); 
        } else {
            res.status(404).send("Dog not found");
        }
    } catch (error) {
        console.error('Error deleting cat:', error);
        res.status(500).send("Internal server error");
    }
});




app.listen(3000, function () {
    console.log("server running at 3000");
})