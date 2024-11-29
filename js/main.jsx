import React, {
  createContext,
  useMemo,
  useContext,
  useState,
  useEffect,
  useRef,
} from "https://esm.sh/react@18.2.0";
import ReactDOM from "https://esm.sh/react-dom@18.2.0";

import STORAGE_DATA from "./js/constant.js";

const dynamicJsonDefault = {
  isMobile: null,
  recordingId: 0,
  videoUrl: null,
  posts: {},
};

// Context 創建
const StorageContext = createContext(undefined);

// Storage Provider 組件
const StorageProvider = ({ children }) => {
  const [staticJson, setStaticJson] = useState(null);
  const [dynamicJson, setDynamicJson] = useState(dynamicJsonDefault);

  useEffect(() => {
    setStaticJson(STORAGE_DATA);
  }, [STORAGE_DATA]);

  const resetDynamicData = (key, value) => {
    setDynamicJson((prev) => ({ ...prev, [key]: value }));
  };

  const storageContextData = useMemo(() => {
    return {
      staticJson,
      dynamicJson,
      resetDynamicData,
    };
  }, [dynamicJson, staticJson]);

  if (!staticJson) return null;

  return (
    <StorageContext.Provider value={storageContextData}>
      {children}
    </StorageContext.Provider>
  );
};

// 上傳
const ImageFrameMerger = () => {
  const { staticJson } = useContext(StorageContext);
  const { config } = staticJson || {};
  const [uploadedImage, setUploadedImage] = useState(null);
  const canvasRef = useRef(null);
  const [frameImage, setFrameImage] = useState(null);

  useEffect(() => {
    if (config?.res?.noImage1) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = config.res.noImage1;
      img.onload = () => {
        setFrameImage(img);
        if (uploadedImage) {
          mergeImages(uploadedImage, img);
        }
      };
    }
  }, [config?.res?.noImage1]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        setUploadedImage(img);
        if (frameImage) {
          mergeImages(img, frameImage);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const mergeImages = (userImage, frame) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 設置畫布大小
    canvas.width = 414;
    canvas.height = canvas.width * 1.75;
    
    // 先繪製框架圖片
    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

    // 計算目標區域在畫布上的位置 - 調整 Y 軸位置為靠上
    const targetWidth = 120;
    const targetHeight = 125;
    const targetX = (canvas.width - targetWidth) / 2 +90;
    const targetY = 80; 

    // 計算圖片縮放比例
    const scaleWidth = targetWidth / userImage.width;
    const scaleHeight = targetHeight / userImage.height;
    const scale = Math.min(scaleWidth, scaleHeight);

    // 計算縮放後的尺寸
    const scaledWidth = userImage.width * scale;
    const scaledHeight = userImage.height * scale;

    const offsetX = (targetWidth - scaledWidth) / 2;
    const offsetY = (targetHeight - scaledHeight) / 2;

    // 繪製上傳的圖片
    ctx.drawImage(
      userImage,
      targetX + offsetX,
      targetY + offsetY,
      scaledWidth,
      scaledHeight
    );

  };

  const downloadMergedImage = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'merged-image.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="w-full min-h-screen bg-gray p-4 flex flex-col items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="relative w-full mb-4 aspect-[0.57]">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
          />
        </div>

        <button
          onClick={downloadMergedImage}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          disabled={!uploadedImage}
        >
          下載合成圖片
        </button>
      </div>
    </div>
  );
};

// App 組件
const App = () => {
  const { staticJson, dynamicJson, resetDynamicData } =
    useContext(StorageContext);
  const { isMobile } = dynamicJson;

  return (
    <div className="flex flex-col w-full">
      <main className="flex flex-col items-center">
        <section className="w-full text-center">
          <p className="text-2xl font-bold mt-4">Image Frame Merger</p>
          <ImageFrameMerger />
        </section>
      </main>
      {isMobile && <MobileNavFooter />}
    </div>
  );
};

// 渲染應用
ReactDOM.render(
  <StorageProvider>
    <App />
  </StorageProvider>,
  document.querySelector("#root")
);
