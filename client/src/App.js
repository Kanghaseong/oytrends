import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [thumbnailData, setThumbnailData] = useState([]);
  //const [showModal, setShowModal] = useState(false);

  const getRandomThumbnails = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/thumbnail/random"
      );
      const { firstData, secondData } = response.data;
      setThumbnailData([firstData, secondData]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getRandomThumbnails();
  }, []);

  const handleClick = () => {
    getRandomThumbnails();
  };

  return (
    <div className="container">
      <h1 className="title">OYTrends</h1>
      <p className="description">
        두 개의 썸네일을 보고 조회수가 더 높을 것 같은 것을 선택하세요.
      </p>
      <div className="thumbnails">
        <div className="thumbnail" onClick={handleClick}>
          <img src={thumbnailData[0]?.url} alt="Thumbnail 1" />
          <p className="thumbnail-title">{thumbnailData[0]?.title}</p>
          <p className="thumbnail-views">{thumbnailData[0]?.viewCount}회</p>
        </div>
        <p className="vs">VS</p>
        <div className="thumbnail" onClick={handleClick}>
          <img src={thumbnailData[1]?.url} alt="Thumbnail 2" />
          <p className="thumbnail-title">{thumbnailData[1]?.title}</p>
          <p className="thumbnail-views">{thumbnailData[1]?.viewCount}회</p>
        </div>
      </div>
    </div>
  );
}

export default App;
