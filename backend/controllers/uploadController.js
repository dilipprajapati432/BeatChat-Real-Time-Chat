import path from 'path';
import axios from 'axios';
import cloudinary from '../config/cloudinary.js';

export const uploadFile = (req, res, next) => {
  console.log('Upload Request - Mimetype:', req.file.mimetype, 'Original Name:', req.file.originalname);

  const ext = path.extname(req.file.originalname).toLowerCase();
  const isImage = req.file.mimetype.startsWith('image/');
  const resourceType = isImage ? 'image' : 'raw';

  console.log('Determined Resource Type:', resourceType);
  const name = path.parse(req.file.originalname).name.replace(/[^a-zA-Z0-9-_]/g, '_'); // Sanitize filename
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

  let publicId = `${name}-${uniqueSuffix}`;
  if (resourceType === 'raw') {
    const fileExt = ext || (req.file.mimetype === 'application/pdf' ? '.pdf' : '');
    if (!publicId.endsWith(fileExt)) {
      publicId += fileExt;
    }
  }

  const stream = cloudinary.uploader.upload_stream({
    resource_type: resourceType,
    public_id: publicId,
    use_filename: true,
    unique_filename: false
  }, (error, result) => {
    if (error) {
      console.error('Cloudinary Upload Error:', error);
      return res.status(500).json({ error: 'Cloudinary upload failed' });
    }
    console.log('File uploaded successfully:', result.secure_url);
    res.json({ url: result.secure_url });
  });

  stream.end(req.file.buffer);
};

export const downloadProxy = async (req, res) => {
  const { url, filename } = req.query;
  if (!url || !filename) return res.status(400).json({ error: 'Missing url or filename' });

  try {
    const decodedUrl = decodeURI(url);
    const encodedUrl = encodeURI(decodedUrl);

    console.log('Download Proxy Request:', { original: url, encoded: encodedUrl });

    const response = await axios({
      method: 'GET',
      url: encodedUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const ext = path.extname(filename).toLowerCase();

    const mimeMap = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png'
    };

    let contentType = mimeMap[ext] || response.headers['content-type'] || 'application/octet-stream';

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);

    response.data.pipe(res);
  } catch (error) {
    console.error('Download error details:', error.response ? error.response.status : error.message);
    if (error.response?.status === 401 || error.response?.status === 404) {
      console.log("Attempting to redirect to original URL as fallback");
      return res.redirect(url);
    }
    res.status(500).json({ error: 'Failed to download file', details: error.message, status: error.response?.status });
  }
};
