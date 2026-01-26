# AWS S3 Integration Guide

## Cost Analysis

### Pricing Breakdown (US East)

**Storage Costs:**
- **Standard Storage**: $0.023 per GB/month for first 50TB
- **Infrequent Access**: $0.0125 per GB/month (for backups)

**Request Costs:**
- **PUT/POST/PATCH**: $0.005 per 1,000 requests
- **GET/SELECT**: $0.0004 per 1,000 requests
- **DELETE**: Free

**Data Transfer:**
- **Upload to S3**: Free
- **Download from S3**: $0.09 per GB (after 100GB free tier/month)
- **Same Region Transfer**: Free

### Cost Examples

**Small App (1,000 active users):**
- Storage: 10GB documents = $0.23/month
- Requests: 50K uploads + 200K downloads = $0.33/month
- Data Transfer: 5GB downloads = $0.45/month
- **Total: ~$1/month**

**Medium App (10,000 active users):**
- Storage: 100GB = $2.30/month
- Requests: 500K uploads + 2M downloads = $3.30/month
- Data Transfer: 50GB downloads = $4.50/month
- **Total: ~$10/month**

**Large App (100,000 active users):**
- Storage: 1TB = $23/month
- Requests: 5M uploads + 20M downloads = $33/month
- Data Transfer: 500GB downloads = $45/month
- **Total: ~$100/month**

### Cost Optimization Tips

1. **Use CloudFront CDN**:
   - Reduces data transfer costs by 50-70%
   - Caches frequently accessed files
   - Better global performance

2. **Lifecycle Policies**:
   - Move old backups to Glacier: $0.004/GB
   - Delete old temporary files automatically

3. **Compression**:
   - Compress documents before upload
   - Can reduce storage by 60-80%

4. **Multipart Upload**:
   - For files >100MB, use multipart upload
   - Reduces failed upload retries

---

## Alternatives to S3

### 1. **Local Storage (Development)**
- **Cost**: Free
- **Pros**: No external dependencies, faster for dev
- **Cons**: Not scalable, no redundancy
- **Use Case**: Development and testing

### 2. **Cloudflare R2**
- **Cost**: $0.015/GB storage, **FREE egress**
- **Pros**: No data transfer fees, S3-compatible API
- **Cons**: Newer service, fewer features
- **Use Case**: Apps with high download volume

### 3. **Backblaze B2**
- **Cost**: $0.005/GB storage, $0.01/GB download
- **Pros**: Very cheap storage, S3-compatible
- **Cons**: Slower than S3, limited regions
- **Use Case**: Backups and archives

### 4. **Azure Blob Storage**
- **Cost**: $0.018/GB storage (similar to S3)
- **Pros**: Better if using Azure ecosystem
- **Cons**: Slightly more complex API
- **Use Case**: Multi-cloud strategy

---

## When to Use S3

✅ **Use S3 if:**
- You need 99.999999999% durability
- You have >1GB of user-uploaded content
- You need global CDN distribution
- You want automatic backups and versioning
- You're already on AWS

❌ **Skip S3 if:**
- You're in early MVP stage (use local storage)
- You have <100 active users
- Budget is <$50/month
- You only store temporary files

---

## Implementation Guide

### 1. Setup AWS Account

```bash
# Install AWS CLI
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

### 2. Configure Environment Variables

```env
# .env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=writerstree-documents
```

### 3. Create S3 Service (server/src/services/s3Service.js)

```javascript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadDocument = async (fileBuffer, fileName, mimeType) => {
  const key = `documents/${Date.now()}-${fileName}`;
  
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    },
  });

  await upload.done();
  return key;
};

export const getDocumentUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

export const deleteDocument = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
};
```

### 4. Update Export Controller

```javascript
import { uploadDocument, getDocumentUrl } from '../services/s3Service.js';

export const exportDocument = async (req, res) => {
  try {
    // Generate document buffer (DOCX/PDF)
    const buffer = await generateDocument(project, format);
    
    // Upload to S3
    const key = await uploadDocument(
      buffer,
      `${project.title}.${format}`,
      mimeType
    );
    
    // Get signed URL (valid for 1 hour)
    const url = await getDocumentUrl(key, 3600);
    
    res.json({ 
      success: true, 
      url,
      expiresIn: 3600 
    });
  } catch (error) {
    logger.error('Export failed:', error);
    res.status(500).json({ error: 'Export failed' });
  }
};
```

### 5. Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://writerstree-documents --region us-east-1

# Set bucket policy (private)
aws s3api put-bucket-acl --bucket writerstree-documents --acl private

# Enable versioning (optional)
aws s3api put-bucket-versioning --bucket writerstree-documents --versioning-configuration Status=Enabled
```

### 6. Setup CORS (for direct uploads from frontend)

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:5173", "https://yourapp.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

```bash
aws s3api put-bucket-cors --bucket writerstree-documents --cors-configuration file://cors.json
```

---

## Recommendation

**For MVP (Current Stage):**
- ✅ **Use local file storage** for now
- Save exports to `server/uploads/` directory
- Serve via Express static middleware
- Switch to S3 when you have >100 paying users

**Migration Path:**
1. Start with local storage
2. Add S3 when monthly costs justify it (~$5-10/month usage)
3. Use CloudFront CDN when global users need fast access
4. Implement lifecycle policies when storage >100GB

**Estimated Timeline:**
- MVP: Local storage (0-1000 users)
- Growth: S3 Standard (1K-10K users)
- Scale: S3 + CloudFront + Lifecycle (10K+ users)
