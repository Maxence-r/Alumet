const express = require('express');
const router = express.Router();
const Post = require('../../models/post');
const validateObjectId = require('../../middlewares/validateObjectId');
const postLayer = require('../../middlewares/postLayer');
const alumetAuth = require('../../middlewares/api/alumetAuth');
const Alumet = require('../../models/alumet');
const { tokenC } = require('../../config.json');
const jwt = require('jsonwebtoken');
const Upload = require('../../models/upload');

router.post('/:alumet/:wall', validateObjectId, alumetAuth, postLayer, async (req, res) => {
  const post = new Post({
      title: req.body.title,
      content: req.body.content,
      owner: req.ownerId,
      ownerType: req.ownerType,
      type: req.body.type,
      typeContent: req.contentType,
      color: req.body.color,
      position: req.position,
      wallId: req.params.wall,
      visible: req.body.tcs
  });
  post.save()
  .then(async (post) => {
    let editedPost = { ...post._doc };
    
    if (post.ownerType !== 'teacher') {
      if (req.cookies.alumetToken === editedPost.owner) {
        console.log('true');
        editedPost.owning = true;
      }
      const decodedToken = jwt.verify(post.owner, tokenC);
      editedPost.owner = decodedToken.username;
    } else if (req.logged) {
      console.log(req.logged)
      editedPost.owning = true;
    }

    if (post.type === 'file') {
      const upload = await Upload.findById(post.typeContent);
      
      if (upload) {
        editedPost.fileName = upload.displayname;
        editedPost.fileExt = upload.mimetype;
      }
    }

    res.json(editedPost);
  })
  .catch(error => res.json({ error }));
});


router.get('/:alumet/:wall', validateObjectId, alumetAuth, async (req, res) => {
    try {
      const alumet = await Alumet.findById(req.params.alumet);
  
      if (!alumet) {
        return res.status(404).json({ error: 'Unable to proceed your requests' });
      }
  
      if (!req.logged && !req.auth) {
        return res.status(404).json({ error: 'Unauthorized x000' });
      }
  
      if (req.logged && !req.auth && alumet.owner !== req.user.id) {
        return res.status(404).json({ error: 'Unauthorized' });
      }
      
      if (req.auth && !req.logged && alumet._id.toString() !== req.alumet.id) {
        return res.status(404).json({ error: 'Unauthorized x002' });
      }
      
      const posts = await Post.find({ wallId: req.params.wall }).sort({ position: -1 });
      
      const sendPosts = await Promise.all(posts.map(async (post) => {
        let editedPost = { ...post._doc };
        if (post.ownerType !== 'teacher') {
          if (req.cookies.alumetToken === editedPost.owner) {
            editedPost.owning = true;
          }
          const decodedToken = jwt.verify(post.owner, tokenC);
          editedPost.owner = decodedToken.username;
        } else if (req.logged) {
          console.log("req.logged")
          editedPost.owning = true;
        }
        if (post.type === 'file') {
          const upload = await Upload.findById(post.typeContent);
  
          if (upload) {
            editedPost.fileName = upload.displayname;
            editedPost.fileExt = upload.mimetype;
          }
        }
        return editedPost;
      }));
      res.json(sendPosts);
    } catch (error) {
      console.error(error);
    }
  });
  
  router.patch('/:alumet/:wall/:post', validateObjectId, alumetAuth, postLayer, (req, res) => {
    Post.findOneAndUpdate({ _id: req.params.post }, {
        title: req.body.title,
        content: req.body.content,
        type: req.body.type,
        typeContent: req.contentType,
        color: req.body.color,
        position: req.position,
        visible: req.body.tcs
    }, { runValidators: true})
    .then(post => res.json(post))
    .catch(error => res.json({ error }));
    });

    
      
      router.put('/move/:alumet/:postId', alumetAuth, async (req, res) => {
        console.log(req.auth);
        const alumet = await Alumet.findById(req.params.alumet);
    
        if (!alumet) {
          return res.status(404).json({ error: 'Unable to proceed your requests' });
        }
    
        if (!req.logged && !req.auth) {
          return res.status(404).json({ error: 'Unauthorized x000' });
        }
    
        if (req.logged && alumet.owner !== req.user.id) {
          return res.status(404).json({ error: 'Unauthorized' });
        }
      
        try {
          const { postId } = req.params;
          const { min, max } = req.body;
          
          const post = await Post.findById(postId);
          if (!post) {
            return res.status(404).json({ error: 'Post not found' });
          }
      
          if (min === max) {
            return res.status(400).json({ error: 'No changes' });
          }
      
          if (min > max) {
            await Post.updateMany({ position: { $gte: max, $lte: min }}, { $inc: { position: 1 }});
          } else {
            await Post.updateMany({ position: { $gte: min, $lte: max }}, { $inc: { position: -1 }});
          }
      
          post.position = max;
          await post.save();
          
          res.json({ message: 'Post positions updated' });
        } catch (err) {
          console.error(err);
          res.status(500).json({ error: 'Internal server error' });
        }
      });
      
        

module.exports = router;