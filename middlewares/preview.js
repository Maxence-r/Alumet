const fs = require('fs');
const path = require('path');
const pdfThumbnail = require('pdf-thumbnail');


const previewHandler = (options = {}) => {
    console.log("Preview handler called");
    const { destination = './cdn', width = 200 } = options;
    
    return (req, res, next) => {
      const { file } = req;
      
      // Check if the file is a PDF
      if (file.mimetype === 'application/pdf') {
        // Create a new filename for the preview
        const previewFilename = `${path.parse(file.filename).name}.png`;
        const previewPath = path.join(destination, previewFilename);
        
        // Use pdf-thumbnail to create a PNG preview of the first page of the PDF
        pdfThumbnail(file.path, { width, height: 0, output: previewPath })
          .then(() => {
            console.log(`Preview created: ${previewFilename}`);
            // Update the request object with the preview filename
            req.previewFilename = previewFilename;
            next();
          })
          .catch((err) => {
            console.error(`Error creating preview: ${err.message}`);
            next(err);
          });
      } else {
        // For other file types, simply call the next middleware
        next();
      }
    };
  };
  
  module.exports = previewHandler;