const express=require('express');
const router=express.Router();
const Post = require('../models/post');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const adminLayout = '../views/layouts/admin';

const jwtSecret = process.env.jwt_secret;


router.post('/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne( { username } );
    if(!user) {
      // return res.status(401).json( { message: 'Invalid credentials' } );
      return res.redirect('/invalid');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid) {
      // return res.status(401).json( { message: 'Invalid credentials' } );
      return res.redirect('/invalid');
    }

    const token = jwt.sign({ userId: user._id}, jwtSecret ,{expiresIn: "1h"} );
    res.cookie('token', token, { httpOnly: true});
    
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }
});

const authMiddleware = (req, res, next ) => {
     
     const token = req.cookies.token;
    
    // console.log(token);
    // console.log('\n');
    if(!token) {
      return res.status(401).json( { message: 'Unauthorized'} );
    }
  
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.userId = decoded.userId;
      
      next();
    } catch(error) {
      res.status(401).json( { message: 'Unauthorized'} );
    }
  }

router.get('/admin', async (req, res) => {
    try {
      const locals = {
        title: "Admin",
        description: "Simple Blog created with NodeJs, Express & MongoDb."
      }
  
      res.render('admin/index', { locals,layout: adminLayout });
    } catch (error) {
      console.log(error);
    }
  });
  router.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      try {
        const user = await User.create({ username, password:hashedPassword });
        
        const token = jwt.sign({ userId: user._id}, jwtSecret ,{expiresIn: "1h"} );
        res.cookie('token', token, { httpOnly: true});
        
        res.redirect('/dashboard');
        
        
      } catch (error) {
        if(error.code === 11000) {
          
          res.redirect('/userExists');
        }
        else{
          
          res.redirect('/404');
        }
      }
  
    } catch (error) {
      console.log(error);
    }
  });


  

  router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
      const locals = {
        title: 'Dashboard',
        description: 'Simple Blog created with NodeJs, Express & MongoDb.'
      }
      // var passedVariable = req.query.valid;
      
      const data = await Post.find({userId: req.userId,}).sort({ createdAt: -1 });
      res.render('admin/dashboard', {
        locals,
        data,
        layout: adminLayout
      });
      
    } catch (error) {
      console.log(error);
    }
  
  });
  

  router.get('/add-post', authMiddleware, async (req, res) => {
    try {
      const locals = {
        title: 'Add Post',
        description: 'Simple Blog created with NodeJs, Express & MongoDb.'
      }
      console.log(req.userName);
      const data = await Post.find();
      res.render('admin/add-post', {
        locals,
        layout: adminLayout
      });
  
    } catch (error) {
      console.log(error);
    }
  
  });

  router.post('/add-post', authMiddleware, async (req, res) => {
    try {
      try {
        const newPost = new Post({
          title: req.body.title,
          body: req.body.body,
          userId: req.userId
        });
  
        await Post.create(newPost);
        res.redirect('/dashboard');
      } catch (error) {
        console.log(error);
      }
  
    } catch (error) {
      console.log(error);
    }
  });

  router.get('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
  
      const locals = {
        title: "Edit Post",
        description: "Free NodeJs User Management System",
      };
  
      const data = await Post.findOne({ _id: req.params.id });
  
      res.render('admin/edit-post', {
        locals,
        data,
        layout: adminLayout
      })
  
    } catch (error) {
      console.log(error);
    }
  
  });

  router.put('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
  
      await Post.findByIdAndUpdate(req.params.id, {
        title: req.body.title,
        body: req.body.body,
        updatedAt: Date.now()
      });
  
      res.redirect(`/dashboard`);
  
    } catch (error) {
      console.log(error);
    }
  
  });
  router.delete('/delete-post/:id', authMiddleware, async (req, res) => {

    try {
      await Post.deleteOne( { _id: req.params.id } );
      res.redirect('/dashboard');
    } catch (error) {
      console.log(error);
    }
  
  });

  router.get('/logout', (req, res) => {
    console.log('Logging out');
    const present=req.cookies.token;
    console.log(present);
    res.clearCookie('token');
    //res.json({ message: 'Logout successful.'});
    res.redirect('/');
  });

 
  
module.exports = router;
