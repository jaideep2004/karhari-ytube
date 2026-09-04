# Graph Report - karhari-tube  (2026-09-02)

## Corpus Check
- 52 files · ~38,010 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 154 nodes · 211 edges · 8 communities detected
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]

## God Nodes (most connected - your core abstractions)
1. `R2Provider` - 18 edges
2. `getDb()` - 14 edges
3. `R2_BUCKET_NAME()` - 12 edges
4. `processVideoJob()` - 12 edges
5. `findUserByEmail()` - 11 edges
6. `generateVideo()` - 9 edges
7. `videoJobsCollection()` - 8 edges
8. `ensureDir()` - 7 edges
9. `generateAlbumVideo()` - 7 edges
10. `updateVideoJob()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `refreshYoutubeAccessToken()` --calls--> `getValidGoogleAccessToken()`  [INFERRED]
  src\lib\social\youtube.ts → src\lib\video\jobProcessor.ts
- `GET()` --calls--> `findUserByEmail()`  [INFERRED]
  src\app\api\admin\stats\route.ts → src\lib\db\users.ts
- `GET()` --calls--> `findUserByEmail()`  [INFERRED]
  src\app\api\auth\youtube\channels\route.ts → src\lib\db\users.ts
- `GET()` --calls--> `findUserByEmail()`  [INFERRED]
  src\app\api\jobs\route.ts → src\lib\db\users.ts
- `POST()` --calls--> `findUserByEmail()`  [INFERRED]
  src\app\api\jobs\route.ts → src\lib\db\users.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (6): R2_ACCESS_KEY_ID(), R2_BUCKET_NAME(), R2_ENDPOINT(), R2_PUBLIC_DOMAIN(), R2_SECRET_ACCESS_KEY(), R2Provider

### Community 1 - "Community 1"
Cohesion: 0.21
Nodes (14): GET(), getDb(), getMongoClient(), decryptIfPresent(), encryptIfPresent(), findUserByEmail(), findUserByFacebookId(), findUserByGoogleSub() (+6 more)

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (12): POST(), createVideoJob(), ensureVideoJobIndexes(), getVideoJob(), listVideoJobs(), setJobProgress(), updateVideoJob(), videoJobsCollection() (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.34
Nodes (13): cacheVideoToR2(), cleanupTempFiles(), concatAudio(), ensureDir(), generateAlbumVideo(), generateTrackVideo(), generateVideo(), getCachedVideo() (+5 more)

### Community 4 - "Community 4"
Cohesion: 0.28
Nodes (6): getStats(), logEvent(), GET(), isAdminEmail(), GET(), POST()

### Community 5 - "Community 5"
Cohesion: 0.36
Nodes (6): uploadToFacebook(), downloadKeyToTmp(), getFacebookPageToken(), getUserForJob(), getValidGoogleAccessToken(), processVideoJob()

### Community 6 - "Community 6"
Cohesion: 0.57
Nodes (6): httpsRequestPromise(), initiateUpload(), queryUploadStatus(), refreshYoutubeAccessToken(), sendChunkWithRetry(), uploadToYoutube()

### Community 7 - "Community 7"
Cohesion: 0.7
Nodes (4): computeBarAmplitudes(), decodeAudioToPCM(), generateCircleVideo(), smoothArray()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `processVideoJob()` connect `Community 5` to `Community 2`, `Community 3`, `Community 6`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Why does `generateVideo()` connect `Community 3` to `Community 5`, `Community 7`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `getDb()` connect `Community 1` to `Community 2`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `getDb()` (e.g. with `GET()` and `logEvent()`) actually correct?**
  _`getDb()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `processVideoJob()` (e.g. with `POST()` and `getVideoJob()`) actually correct?**
  _`processVideoJob()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `findUserByEmail()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`findUserByEmail()` has 8 INFERRED edges - model-reasoned connections that need verification._