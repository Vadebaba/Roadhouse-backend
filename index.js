
const port = 4000;
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

//app.use(express.json());

//Database connection with mongodb
mongoose.connect=(`${process.env.RH}`)

const corsOptions = {
    origin: 'https://roadhouse-admin.vercel.app',
    methods: 'GET, POST, OPTIONS, PUT, DELETE',
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept'
  };
  
  app.use(cors(corsOptions));
  
  app.use(express.json());
  
  app.post('/addproduct', (req, res) => {
    // Your logic to add the product
    res.json({ message: 'Product added successfully' });
  });
  



//Api craetion
app.get('/', (req, res) => {
    res.send("Express App is running");
})

app.get('/allproducts', (req, res) => {
    // Your code to fetch and return products
    res.json({ products: [] }); // Example response
  });
 

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'upload/images'); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  
  const upload = multer({ storage: storage });
  
  app.post('/upload', upload.single('product'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ success: false, message: 'No file uploaded' });
      }
      const imageUrl = `https://roadhouse-backend.onrender.com/uploads/${req.file.filename}`;
      res.status(200).send({ success: true, image_url: imageUrl });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
  });
  



/*image storage engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname
            (file.originalname)}`)
    }
})

const upload = multer({ storage: storage });


//creating upload endpoint for image
app.use('/images', express.static('upload/images'))
app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `https://roadhouse-backend.onrender.com/images/${req.file.filename}`
    })
});*/

//scheme for creatig products
const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    },
})

app.post('/addproduct', async (req, res) => {
    try {
      // Ensure the request body contains the required fields
      const { name, image, category, new_price, old_price } = req.body;
      if (!name || !image || !category || !new_price || !old_price) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }
  
      // Fetch all products
      let products = await Product.find({});
  
      // Determine the new product ID
      let id;
      if (products.length > 0) {
        let last_product = products[products.length - 1];
        id = last_product.id + 1;
      } else {
        id = 1;
      }
  
      // Create a new product instance
      const product = new Product({
        id: id,
        name: name,
        image: image,
        category: category,
        new_price: new_price,
        old_price: old_price,
      });
  
      // Save the product to the database
      await product.save();
      console.log('Saved', product);
  
      // Respond with success
      res.json({ success: true, name: name });
    } catch (error) {
      console.error('Error adding product:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
  });
  


/*creating api to add products
app.post('/addproduct', async (req, res) => {
    let products = await Product.find({});
    let id;
    if (products.length > 0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    } else {
        id = 1;
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log('Saved')
    res.json({
        success: true,
        name: req.body.name,
    })
});*/

//creating api to add products
app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("Removed");
    res.json({
        success: true,
        name: req.body.name,
    });
})

//creating api to get all products
app.get('/allproducts', async (req, res) => {
    let products = await Product.find({});
    console.log("All products fetched")
    res.send(products);
})


//scheme user model
const User = mongoose.model('User', {
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    }
})

//Creating endpoint for registering the user
app.post('/signup', async (req, res) => {
    let check = await User.findOne({ email: req.body.email });
    if (check) {
        return res.status(400).json({
            success: false, errors:
                "Existing user found with same email address"
        });
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
    }
    const user = new User({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    })
    await user.save();

    const data = {
        user: {
            id: user.id
        }
    }
    const token = jwt.sign(data, "secret_ecom");
    res.json({ success: true, token })
})

//Creating endpoint for user login
app.post('/login', async (req, res) => {
    let user = await User.findOne({ email: req.body.email });
    if (user) {
        const passMatch = req.body.password === user.password;
        if (passMatch) {
            const data = {
                user: {
                    id: user.id
                }
            }
            const token = jwt.sign(data, "secret_ecom");
            res.json({ success: true, token });
        } else {
            res.json({ success: false, errors: "wrong password" });
        }
    } else {
        res.json({ success: false, errors: "wrong email address" })
    }
});

//Creating endpoint for latest products
app.get('/newcollection', async (req, res) => {
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log('newcollection fetched')
    res.send(newcollection);
})

//Creating endpoint for user popular products
app.get('/popularproducts', async (req, res) => {
    let products = await Product.find({ category: "men" });
    let popularproducts = products.slice(0, 4);
    console.log('popular products fetched')
    res.send(popularproducts);
})


//Creating middlewear to fetch user
const fetchUser = async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        res.status(401).send({ errors: "Please authenticate using a valid login" })
    } else {
        try {
            const data = jwt.verify(token, 'secret_ecom');
            req.user = data.user;
            next();
        } catch (error) {
            res.status(401).send({ errors: "Please authenticate using a valid token" });
        }
    }
}

//Creating endpoint for adding products cartdata
app.post('/addtocart', fetchUser, async (req, res) => {
    console.log("Added", req.body.itemId)
    let userData = await User.findOne({ _id: req.user.id })
    userData.cartData[req.body.itemId] += 1;
    await User.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Added");
})

//Creating endpoint for removing products in cartdata
app.post('/removefromcart', fetchUser, async (req, res) => {
    console.log("Removed", req.body.itemId)
    let userData = await User.findOne({ _id: req.user.id });
    if(userData.cartData[req.body.itemId] >0)
    userData.cartData[req.body.itemId] -= 1;
    await User.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Removed");
})


//Creating endpoint for removing products in cartdata
app.post('/getcart', fetchUser, async (req, res) => {
    console.log('Get cart');
    let userData = await User.findOne({ _id: req.user.id });
   res.json(userData.cartData);
})



app.listen(port, (error) => {
    if (!error) {
        console.log('Server is speeding  on port ' + port);
    } else {
        console.log("error: " + error);
    }
})
