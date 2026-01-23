# Profile Video (Feeds) Feature - Comprehensive Analysis

## 📋 Overview

The Profile Video (Feeds) feature is a core component of the Actory platform that allows actors to upload, showcase, and discover videos. It functions as a social feed where actors can view and engage with content from the community through likes, comments, and shares.

---

## 🏗️ Architecture Overview

### Two Storage Models

The system uses a **hybrid approach** with videos stored in two locations:

1. **Video Collection** - Dedicated MongoDB collection for profile/audition videos
2. **User.videos Embedded Array** - Videos stored directly in the User document

This dual approach ensures:
- **Backward compatibility** with existing embedded videos
- **Scalability** with dedicated Video collection
- **De-duplication** when merging data from both sources

---

## 💾 Data Models

### Video Model (`actory-spotlight-backend/models/Video.js`)

```javascript
VideoSchema {
  // Core Fields
  title: String (required)
  videoUrl: String (required) 
  cloudinaryId: String (required) - Cloudinary reference
  description: String
  category: String enum['Monologue', 'Dance', 'Demo Reel', 'Other']
  
  // References
  actor: ObjectId (ref: User, required)
  castingCall: ObjectId (ref: CastingCall)
    - Optional for profile videos
    - Required for audition videos
  
  // Video Type Classification
  type: String enum['profile', 'audition']
    - Default: 'audition' (backward compatibility)
    - Profile videos are public in feeds
    - Audition videos are for specific casting calls
  
  // Video Metadata (Required for auditions, optional for profiles)
  height: Number (audition-only)
  weight: Number (audition-only)
  age: Number (audition-only)
  skills: [String] (audition-only)
  permanentAddress: String (audition-only)
  livingCity: String (audition-only)
  dateOfBirth: Date (audition-only)
  phoneNumber: String (audition-only)
  email: String
  
  // Quality Assessment (Automated)
  qualityAssessment: {
    level: String enum['High', 'Medium', 'Low']
    score: Number
    details: {
      scores: {
        video: { resolution, duration, lighting, audio }
        engagement: { watchTimePercentage, retakes, shortlistHistory }
        relevance: { keywordMatch }
      }
      weights: { ... }
    }
  }
  
  // Video Metrics
  videoMetrics: {
    height: Number (video resolution)
    duration: Number
    brightness: Number
    audioQuality: Number
    retakes: Number
    watchTime: Number
  }
  
  // Engagement
  status: String enum['Pending', 'Accepted', 'Rejected']
  views: Number (default: 0)
  likes: Number (default: 0)
  comments: Number (default: 0)
  likedBy: [ObjectId] (array of user IDs who liked)
  
  // Timestamps
  createdAt: Date
}
```

### User Model Embedded Videos (`actory-spotlight-backend/models/User.js`)

```javascript
VideoSchema (embedded in User.videos) {
  _id: ObjectId (auto-generated)
  title: String (maxlength: 100)
  description: String (maxlength: 500)
  category: String enum['Monologue', 'Dance', 'Demo Reel', 'Other']
  url: String (required)
  thumbnailUrl: String (required)
  duration: Number (required)
  views: Number (default: 0)
  likes: Number (default: 0)
  comments: Number (default: 0)
  likedBy: [ObjectId] (ref: User)
  isActive: Boolean (default: true)
  uploadedAt: Date (default: Date.now)
}
```

**Key Differences:**
- Embedded videos use `url` field, Video collection uses `videoUrl`
- Embedded videos are simpler, Video collection has audition-specific fields
- Both support likes, comments, and view tracking

---

## 🛣️ API Routes (`actory-spotlight-backend/routes/videos.js`)

### Public Feeds
| Route | Method | Access | Description |
|-------|--------|--------|-------------|
| `/api/v1/videos/public` | GET | Public/Optional Auth | Get all profile videos for feeds |
| `/api/v1/videos/:videoId/view` | PUT | Public | Increment video view count |
| `/api/v1/videos/:videoId/like` | PUT | Public | Toggle like on video |
| `/api/v1/videos/:videoId/comments` | GET | Public | Get comments for a video |
| `/api/v1/videos/:videoId/comment` | POST | Public | Add comment to video |

### Profile Videos (Actor Only)
| Route | Method | Access | Description |
|-------|--------|--------|-------------|
| `/api/v1/videos/profile` | GET | Private (Actor) | Get current user's profile videos |
| `/api/v1/profile/videos` | POST | Private (Actor) | Upload a profile video |
| `/api/v1/videos/profile/videos/:id` | DELETE | Private (Actor) | Delete a profile video |

### Audition Videos
| Route | Method | Access | Description |
|-------|--------|--------|-------------|
| `/api/v1/videos/mine` | GET | Private (Actor) | Get current user's audition submissions |
| `/api/v1/casting/:castingCallId/videos` | GET | Private (Producer) | Get audition videos for a casting call |
| `/api/v1/casting/:castingCallId/videos` | POST | Private (Actor) | Submit audition video |
| `/api/v1/videos/:id/status` | PATCH | Private (Producer) | Update submission status |
| `/api/v1/videos/:id/metrics` | PUT | Private (Producer) | Update video metrics |
| `/api/v1/videos/:id` | DELETE | Private (Owner/Admin) | Delete video |

---

## 🎬 Controller Methods (`actory-spotlight-backend/controllers/videos.js`)

### Key Public Endpoint: `getPublicVideos`

This is the **primary feed endpoint** used by the Feeds page.

**Flow:**
1. Fetch all **profile videos** from Video collection
   ```javascript
   Video.find({ type: 'profile' })
     .populate('actor', 'name email profileImage')
     .sort({ createdAt: -1 })
   ```

2. Fetch all **embedded videos** from User documents
   ```javascript
   User.find({ videos: { $exists: true, $not: { $size: 0 } } })
     .select('name email profileImage videos')
   ```

3. **Transform embedded videos** to match Video collection format
   - Map `videos.url` → `videoUrl`
   - Preserve likes, comments, views
   - Include actor information

4. **Merge both sources** and de-duplicate
   - Use `videoUrl + title` as unique key
   - Prevent showing same video twice

5. **Sort** by creation date (most recent first)

6. **Transform for frontend**
   - Generate thumbnail if missing
   - Ensure all fields present (views, likes, comments, etc.)
   - Check if current user liked the video
   - Convert dates to ISO format

**Response Example:**
```json
{
  "success": true,
  "count": 42,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "My Audition Demo",
      "description": "A monologue performance",
      "videoUrl": "https://res.cloudinary.com/...",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "duration": 120,
      "views": 45,
      "likes": 12,
      "comments": 3,
      "isLiked": false,
      "category": "Profile Video",
      "type": "profile",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "actor": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Actor",
        "email": "john@example.com",
        "profileImage": "https://res.cloudinary.com/..."
      }
    }
  ]
}
```

### Other Important Methods

| Method | Purpose |
|--------|---------|
| `getMyProfileVideos` | Get videos for logged-in actor |
| `uploadProfileVideo` | Upload new profile video (multipart/form-data) |
| `deleteProfileVideo` | Remove profile video from either storage |
| `incrementVideoView` | Track view count |
| `toggleVideoLike` | Add/remove like, update like count |
| `addVideoComment` | Add comment to video |
| `getVideoComments` | Fetch all comments for a video |
| `updateStatus` | Accept/reject audition (producers only) |
| `updateVideoMetrics` | Update video quality metrics (producers only) |

---

## 🎨 Frontend Implementation

### Main Feeds Page (`actory-spotlight-ui/src/pages/Feeds.jsx`)

**Key Features:**
- Fetches public videos on load
- Displays videos in responsive grid (1-4 columns)
- Infinite scroll support
- Video modal with full-screen playback
- Keyboard navigation (↑/↓ to browse, ESC to close)
- Like/comment/share functionality
- Comment modal with nested comment viewing

**State Management:**
```javascript
const [selectedVideo, setSelectedVideo] = useState(null);
const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
const [selectedVideoForComments, setSelectedVideoForComments] = useState(null);
const [newComment, setNewComment] = useState('');
const [videoComments, setVideoComments] = useState({}); // Comments per video
const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
```

**Video Grid Display:**
- **Thumbnail:** Video poster with hover autoplay
- **Overlay:** Play button appears on hover
- **User Info:** Actor avatar, name, upload date
- **Actions:** Like, comment, share buttons
- **Stats:** View count, duration, type badge

**Engagement Features:**
1. **Likes** - Toggle with heart icon, optimistic updates
2. **Comments** - Modal-based comment system
3. **Share** - Copy profile link to clipboard or native share
4. **View Tracking** - Increment view count on modal open

### Video List Component (`actory-spotlight-ui/src/components/profile/VideoList.jsx`)

**Used in:**
- Actor Profile page (user's own videos)
- Public Profile page (viewing other actor's videos)

**Features:**
- Grid layout with video cards
- Delete button for owned videos
- Like/comment/share actions
- Full-screen modal on click
- Thumbnail and video metadata display

---

## 📱 User Flows

### Actor Uploading a Profile Video

```
Actor Profile Page
    ↓
[Upload Button]
    ↓
Select Video File (multipart/form-data)
    ↓
POST /api/profile/videos
    ↓
Cloudinary Upload (with eager thumbnail generation)
    ↓
Save to User.videos array
    ↓
Success Toast
    ↓
Video appears in profile grid
```

**Endpoint:** `POST /api/profile/videos` (in profile.js route)
**Middleware:** `protect`, `authorize('Actor')`, `multer.single('video')`
**Upload Limit:** 50MB

### Viewing Feed

```
User opens /feeds
    ↓
GET /api/v1/videos/public
    ↓
Fetch from Video collection (type: 'profile')
    ↓
Fetch from User.videos arrays
    ↓
De-duplicate and merge
    ↓
Sort by createdAt desc
    ↓
Display grid (1-4 columns, responsive)
```

### Engaging with Videos

**Like:**
```
Click ❤️ button
    ↓
PUT /api/v1/videos/:videoId/like
    ↓
Update video.likes count
    ↓
Add/remove user from likedBy array
    ↓
Update UI (toggle fill, update count)
```

**Comment:**
```
Click comment button
    ↓
Open comment modal
    ↓
GET /api/v1/videos/:videoId/comments (existing)
    ↓
Type comment + submit
    ↓
POST /api/v1/videos/:videoId/comment
    ↓
Display new comment in list
```

**View Tracking:**
```
Open video modal
    ↓
PUT /api/v1/videos/:videoId/view
    ↓
Increment video.views counter
```

---

## 🎥 Video Types & Storage Strategy

### Profile Videos
- **Purpose:** Showcase actor's talent in general (no casting call required)
- **Visibility:** Public (shown in feeds)
- **Storage:** Both Video collection AND User.videos
- **Fields Required:** title, videoUrl, actor
- **Fields Optional:** height, weight, age, skills, etc.

### Audition Videos
- **Purpose:** Submit to specific casting calls
- **Visibility:** Private (only visible to casting call producer)
- **Storage:** Video collection only
- **Fields Required:** All audition metadata (height, weight, age, skills, etc.)
- **Status:** Pending/Accepted/Rejected
- **Quality Scoring:** Automatic evaluation

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│          Frontend (React - Feeds.jsx)           │
│                                                 │
│  - Grid Display (responsive columns)            │
│  - Video Modal with playback                    │
│  - Comment Modal                                │
│  - Like/Share buttons                           │
│  - Keyboard navigation                          │
└────────────────────┬────────────────────────────┘
                     │
                     │ API Calls
                     ↓
┌─────────────────────────────────────────────────┐
│          Backend (Express - videos.js)          │
│                                                 │
│  getPublicVideos()                              │
│  - Fetch Video collection (type: 'profile')     │
│  - Fetch User.videos arrays                     │
│  - Merge & de-duplicate                         │
│  - Transform for frontend                       │
│  - Return with 200 OK                           │
└────────────┬────────────────────┬───────────────┘
             │                    │
             ↓                    ↓
     ┌──────────────┐     ┌──────────────┐
     │ Video Model  │     │ User Model   │
     │              │     │              │
     │ - Profile    │     │ - videos[]   │
     │ - Audition   │     │   (embedded) │
     │ - Metadata   │     │              │
     │ - Engagement │     │              │
     └──────────────┘     └──────────────┘
             │                    │
             └────────┬───────────┘
                      ↓
           ┌─────────────────────┐
           │  Cloudinary (CDN)   │
           │                     │
           │ - Video streaming   │
           │ - Thumbnail serving │
           │ - Eager thumbnail   │
           │   generation        │
           └─────────────────────┘
```

---

## 🔐 Access Control

| Endpoint | Permission | Details |
|----------|-----------|---------|
| GET /public | Public | Anyone can view feeds |
| POST /profile/videos | Actor Only | Upload own profile video |
| DELETE /profile/videos/:id | Video Owner / Admin | Delete own video |
| PATCH /:id/status | Casting Producer | Accept/reject auditions |
| PUT /:id/like | Public | Like videos (no auth required) |
| POST /:id/comment | Public | Add comments (no auth required) |

---

## 📊 Performance Considerations

### Current Implementation
- **Video Queries:** Queries Video collection + User documents
- **De-duplication:** In-memory Map for combining sources
- **Sorting:** Client-side after merge (could be optimized)
- **Pagination:** Not implemented (loads all videos)

### Optimization Opportunities
1. **Implement pagination** - Use skip/limit instead of loading all
2. **Database indexing** - Index on `type: 'profile'` and `createdAt`
3. **Caching** - Cache public feed with invalidation on upload
4. **Separate feeds query** - Move embedded videos to separate collection
5. **Lazy loading** - Load thumbnails/metadata separately from video URL

---

## 🐛 Known Issues & De-duplication

The system prevents duplicate videos when merging Video collection + User.videos:

```javascript
const mergedMap = new Map();
[...videoDocs, ...embeddedVideos].forEach(v => {
  const key = `${v.videoUrl || ''}::${v.title || ''}`;
  if (!mergedMap.has(key)) mergedMap.set(key, v);
});
```

**Potential Issues:**
- Same video with different titles = duplicate
- Missing URL = duplicate (both added as they have different keys)
- Should consider migrating all embedded videos to Video collection

---

## 📝 Summary Table

| Aspect | Details |
|--------|---------|
| **Main Feed Endpoint** | `GET /api/v1/videos/public` |
| **Video Upload** | `POST /api/profile/videos` |
| **Storage Models** | Video Collection + User.videos (embedded) |
| **Frontend Page** | `src/pages/Feeds.jsx` |
| **Video Grid Layout** | Responsive 1-4 columns |
| **Engagement Types** | Likes, Comments, Shares, Views |
| **Quality Tracking** | Automatic quality assessment |
| **CDN** | Cloudinary |
| **Video Types** | Profile (public) + Audition (private) |
| **Keyboard Nav** | ↑/↓ to browse, ESC to close modal |
| **Auth Strategy** | Public for viewing, Actor for uploading |

---

## 🚀 Key Takeaways

1. **Dual Storage Model** ensures backward compatibility while supporting scalability
2. **Hybrid Data Merging** from two sources requires careful de-duplication
3. **Engagement Tracking** through likes, comments, and views with optimistic updates
4. **Quality Assessment** for audition videos using automated metrics
5. **Public Feed** showcases all profile videos in a TikTok-like grid interface
6. **Keyboard Navigation** provides enhanced UX for browsing videos
7. **Comment System** allows community engagement on videos
8. **Cloudinary Integration** handles video storage and thumbnail generation

