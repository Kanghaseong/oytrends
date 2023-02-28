const express = require("express");
const dotenv = require("dotenv");
dotenv.config(); // .env 파일의 환경변수를 읽어들임
const { google } = require("googleapis");
const { JWT } = require("google-auth-library");
const { readFileSync } = require("fs");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const thumbnailSchema = require("./thumbnailSchema");
const mongodbURI = process.env.MONGODB_URI;
const keyPath = path.join(__dirname, process.env.KEY_PATH);
const keyFileContent = readFileSync(keyPath);
const { client_email, private_key } = JSON.parse(keyFileContent);
const port = process.env.PORT || 3000;

const app = express();

mongoose
.connect(mongodbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const corsOptions = {
  origin: "http://localhost:3001",
};

const auth = new JWT({
  email: client_email,
  key: private_key,
  scopes: ["https://www.googleapis.com/auth/youtube.force-ssl"],
});

const youtube = google.youtube({
  version: "v3",
  auth: auth,
});

const channelId = "UCBkyj16n2snkRg1BAzpovXQ";

// 최근 업로드된 동영상의 썸네일 이미지 url을 담을 배열
const videoInfos = [];

// 썸네일 이미지 url을 가져오는 함수
async function getvideoInfos() {
  try {
    // 채널의 동영상 리스트를 가져오는 API를 호출합니다.
    const response = await youtube.search.list({
      part: "id",
      channelId: channelId,
      maxResults: 50,
      order: "date",
      publishedBefore: "2022-11-05T19:46:32.000+00:01",
      type: "video",
    });

    // 동영상 리스트에서 각 동영상의 id를 추출합니다.
    const videoIds = response.data.items.map((item) => item.id.videoId);

    // 각 동영상의 썸네일 이미지 url 및 동영상 정보를 가져와 배열에 담습니다.
    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i];
      const videoResponse = await youtube.videos.list({
        part: "snippet,statistics",
        id: videoId,
      });
      const thumbnailUrl =
        videoResponse.data.items[0].snippet.thumbnails.default.url;
      const viewCount = videoResponse.data.items[0].statistics.viewCount;
      const publishedAt = videoResponse.data.items[0].snippet.publishedAt;
      const title = videoResponse.data.items[0].snippet.title;
      const likeCount = videoResponse.data.items[0].statistics.likeCount;
      const commentCount = videoResponse.data.items[0].statistics.commentCount;

      videoInfos.push({
        url: thumbnailUrl,
        viewCount: viewCount,
        publishedAfter: publishedAt,
        title: title,
        likeCount: likeCount,
        commentCount: commentCount,
      });
    }

    // 썸네일 데이터를 몽고디비에 적재합니다.
    const videoData = videoInfos.map((info) => {
      return {
        url: info.url,
        viewCount: info.viewCount,
        publishedAfter: info.publishedAfter,
        title: info.title,
        likeCount: info.likeCount,
        commentCount: info.commentCount,
      };
    });
    const inserted = await thumbnailSchema.insertMany(videoData);
    console.log(`Inserted ${inserted.length} documents.`);
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
}


async function initApp() {
  try {
    console.log(`Fetching thumbnails from YouTube API...`);
    await getvideoInfos();
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
}

app.use(cors(corsOptions));
app.get("/thumbnail/random", async (req, res) => {
  try {
    // thumbnail 컬렉션에서 랜덤하게 두 개의 문서를 가져옴
    const randomData = await thumbnailSchema.aggregate([{ $sample: { size: 2 } }]);
    
    // 두 개의 문서 중 첫 번째 문서와 두 번째 문서를 객체에 담아 응답
    const firstData = {
      url: randomData[0].url,
      title: randomData[0].title,
      viewCount: randomData[0].viewCount
    };
    
    const secondData = {
      url: randomData[1].url,
      title: randomData[1].title,
      viewCount: randomData[1].viewCount
    };
    
    res.json({
      firstData,
      secondData
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


app.listen(port, () => {
  console.log(`Server started on port ${port}`);

});
