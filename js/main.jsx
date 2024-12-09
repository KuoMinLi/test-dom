import React, {
    memo,
    useState,
    useEffect,
    useMemo,
    useCallback,
} from "https://esm.sh/react@18.2.0";
import ReactDOM from "https://esm.sh/react-dom@18.2.0";
import STORAGE_DATA from "./js/constant.js";
// import { Share2, Facebook } from "https://esm.sh/lucide-react@0.263.1";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png"];
const CANVAS_SCALE = 1.519;
const CANVAS_WIDTH = 414;
const CANVAS_HEIGHT = CANVAS_WIDTH * 1.75;

const ProcessMarker = ({ 
  width = "60px",
  height = "20px",
  left = "50px",
  color = "#8B4513",
  strokeWidth = 1.5,
  questionId = 1
}) => {
  const baseLeft = parseInt(left);
  const additionalOffset = (questionId - 1) * 22; // 每題增加 15px
  const finalLeft = `${baseLeft + additionalOffset}px`;

  return (
    <div 
      className="process-marker"
      style={{
        left: finalLeft
      }}
    >
      <svg 
        viewBox="0 0 40 30"
        style={{
          width: width,
          height: height
        }}
      >
        <path 
          d="M5 25 L35 25 L48 2 L18 2 Z" 
          style={{
            fill: color,
            strokeWidth: strokeWidth
          }}
        />
      </svg>
    </div>
  );
};

const CardFrame = memo(({ config, currentQuestionIndex, imgType }) => {
    const footprintPositions = [
        "top-[17px] left-[17px]",
        "top-[17px] right-[17px]",
        "bottom-[17px] left-[17px]",
        "bottom-[17px] right-[17px]",
    ];

    const backgroundImages = {
        start: config.cardStart,
        cloud: config.cardCloud,
        question: config.cardQuestion
    };

    return (
        <div className="h-full relative w-full max-w-[430px] p-[12px] bg-[#402529] border rounded-[15px] overflow-hidden">
            <div className="relative w-full p-[16px] bg-[#FCDECF] border border-black rounded-[10px]  min-h-[500px]
            ">
                          {/* min-h-[calc(180vw-32px)]" */}
            {currentQuestionIndex === -1 && (
            <div className="absolute inset-0 z-10 pointer-events-none">
                  <img
                      src={config.cloudLeft}
                      alt="cloud-left"
                      className="absolute top-[50%] left-[-10px] w-[150px] cloud-animation"
                  />
                  <img
                      src={config.cloudRight}
                      alt="cloud-right"
                      className="absolute top-[60%] right-[50px] w-[150px] cloud-animation"
                  />
              </div>
            )}
                {Object.entries(backgroundImages).map(([type, src]) => (
                    <img
                        key={type}
                        className={`object-contain w-full transition-opacity duration-300 ${
                            imgType === type ? "opacity-100" : "opacity-0 absolute inset-0"
                        }`}
                        src={src}
                        alt={`background-${type}`}
                    />
                ))}
                {footprintPositions.map((position, index) => (
                    <img
                        key={`footprint-${index}`}
                        className={`absolute w-[26px] ${position}`}
                        src={config?.footprint}
                        alt="footprint"
                    />
                ))}
            </div>
        </div>
    );
});

const StartPage = memo(({ config, onStart, currentQuestionIndex }) => {
    return (
        <div className="flex w-full min-h-[100dvh] items-center justify-center max-w-[430px]">
            <div className="relative w-full">
                <CardFrame imgType="start" config={config} currentQuestionIndex={currentQuestionIndex} />
                <button
                    className="absolute bottom-[65px] left-[calc(50%-76px)]"
                    onClick={onStart}
                >
                    <img
                        className="start-button button-width"
                        src={config.buttons.startButton}
                        alt="start-button-image"
                    />
                </button>
            </div>
        </div>
    );
});

const NameInputPage = memo(({ config, onSubmitName }) => {
    const [catName, setCatName] = useState("");
    const [error, setError] = useState("");

    const isFullWidth = useCallback((char) => {
        // Check if character is full-width (Chinese, Japanese, Korean characters, etc.)
        return char.match(
            /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/
        );
    }, []);

    const getNameLength = useCallback(
        (name) => {
            let length = 0;
            for (let char of name) {
                length += isFullWidth(char) ? 2 : 1;
            }
            return length;
        },
        [isFullWidth]
    );

    const handleNameChange = (e) => {
        const newName = e.target.value;
        const nameLength = getNameLength(newName);

        if (nameLength <= 24) {
            setCatName(newName);
            setError("");
        } else {
            setError("已達字數上限");
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const trimmedName = catName.trim();

        if (!trimmedName) {
            setError("請輸入貓咪名字");
            return;
        }

        const nameLength = getNameLength(trimmedName);
        if (nameLength > 24) {
            setError("名字太長囉！");
            return;
        }

        onSubmitName(trimmedName);
    };

    return (
        <div className="flex w-full min-h-[100dvh] items-center justify-center max-w-[430px]">
            <div className="relative w-full">
                <CardFrame
                    imgType="cloud"
                    config={config}
                />
                <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center 
          w-full px-8 flex flex-col items-center justify-center gap-6"
                >
                    <h2 className="mb-6 text-xl">輸入你家貓咪的名字吧！</h2>
                    <img
                        className="w-[200px] mt-6"
                        src={config.crystalBall}
                        alt="crystal-ball"
                    />
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col items-center gap-6"
                    >
                        <div className="w-full max-w-xs">
                            <div className="flex flex-col items-center">
                                <div className="text-lg">
                                    NAME:
                                    <span className="relative inline-block">
                                        <span className="ml-2 border-b-2 border-gray-300 min-w-[100px] inline-block px-1 min-h-[1.5em] leading-[1.5em]">
                                            {catName || "\u00A0"}
                                        </span>
                                        <input
                                            type="text"
                                            value={catName}
                                            onChange={handleNameChange}
                                            className="absolute inset-0 opacity-0 cursor-text"
                                            required
                                        />
                                    </span>
                                </div>
                                {error && (
                                    <>
                                        <p className="text-red-500 text-sm mt-2">
                                            {error}
                                        </p>
                                        <p className="text-gray-500 text-sm mt-2">
                                            中文/全形符號上限12字
                                            <br />
                                            英文/半形符號上限24字
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                        <button type="submit">
                            <img
                                className="next-button button-width"
                                src={config.buttons.nextButton}
                                alt="submit"
                            />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
});

const QuestionPage = memo(({ currentQuestion, onAnswer, config, catName }) => {
    const questionText = currentQuestion.text.replace("{catName}", catName);

    const addSpaceBetweenChars = (text) => {
        return text.replace(/{catName}/g, " {catName} ").trim();
    };

    return (
        <div className="flex w-full min-h-[100dvh] items-center justify-center max-w-[430px]">
            <div className="relative w-full">
                <CardFrame
                    imgType="question"
                    config={config}
                />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full">  
                    <div className="relative">
                      <img
                          className="w-full max-w-[280px] mx-auto"
                          src={config.step[`step${currentQuestion.id}`]}
                          alt="step"
                      />
                      {currentQuestion.id !== (1 || 12) &&
                        <ProcessMarker 
                            width="40px"
                            height="20px"
                            left="83px"
                            color="white"
                            strokeWidth={0}
                            questionId={currentQuestion.id}
                          />
                      }
                    </div>
                    <div className="mt-6 relative px-6">
                        <img
                            className="w-full max-w-[280px] mx-auto"
                            src={config.questionArea}
                            alt="question-area"
                        />
                        {/* <h2 className="max-w-[200px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl">
              {questionText}
            </h2> */}
                        <h2
                            className="max-w-[280px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                          text-[14pt] text-center overflow-hidden line-clamp-3 leading-[26px] tracking-[2px] whitespace-pre-line"
                            // style={{
                            //     lineHeight: "26px", 
                            //     letterSpacing: "2px",
                            // }}
                        >
                            {addSpaceBetweenChars(questionText)}
                        </h2>
                    </div>
                    <img
                        className="max-h-[135px] h-full mx-auto"
                        src={config.questionImage[`Q${currentQuestion.id}`]}
                        alt="question"
                    />
                    <div className="flex flex-col gap-3 items-center mt-6">
                        <button onClick={() => onAnswer("A")}>
                            <img
                                className="button-answer-width"
                                src={config.buttons[`${currentQuestion.id}A`]}
                                alt="optionA"
                            />
                        </button>
                        <button onClick={() => onAnswer("B")}>
                            <img
                                className="button-answer-width"
                                src={config.buttons[`${currentQuestion.id}B`]}
                                alt="optionB"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

const LoadingPage = memo(({ config }) => (
    <div className="flex w-full min-h-[100dvh] items-center justify-center max-w-[430px]">
        <div className="relative w-full">
            <CardFrame
               imgType="cloud"
                config={config}
            />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
            w-full flex flex-col items-center justify-center">
                <button className="relative">
                  <img
                      className="absolute left-[50px] top-[30px] max-w-[30px] hourglass-spin"
                      src={config.hourGlassIcon}
                      alt="hourglass-icon"
                  />
                  <img
                      className="max-w-[120px]"
                      src={config.loadingPic}
                      alt="loading-pic"
                  />
                </button>
                {/* <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500 mb-4"></div> */}
                {/* <p className="text-xl">處理中...</p>  */}
            </div>
        </div>
    </div>
));

const UploadErrorPage = memo(({ config, onRetry, onRestart }) => (
    <div className="flex w-full min-h-[100dvh] items-center justify-center max-w-[430px]">
        <div className="relative w-full">
            <CardFrame
                imgType="cloud"
                config={config}
            />
            <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
            w-full flex flex-col items-center justify-center"
            >
                {/* <h2 className="text-2xl mb-6">上傳失敗</h2> */}
                <div className="flex flex-col items-center justify-center">
                  {/* 上傳失敗 */}
                  <img
                      className="max-w-[200px]"
                      src={config.uploadFailedFrame}
                      alt="upload_failed"
                      config={config}
                  />
                  <div className="absolute bottom-4 flex flex-col gap-2">
                    {/* 重新上傳 */}
                      <button>
                        <img
                            className="max-w-[130px]"
                            src={config.buttons.reUploadButton}
                            alt="reupload-button"
                            onClick={onRetry}
                            // className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                        />
                      </button>
                       {/* 重測一次 */}
                       <button>
                        <img
                            className="max-w-[130px]"
                            src={config.buttons.reUploadButton}
                            alt="restart-button"
                            onClick={onRestart}
                            // className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                        />
                      </button>
                  </div>
                </div>
            </div>
                            下面是restart，圖要改
        </div>
    </div>
));

// 雲朵卡片組件
const CloudCard = memo(({ children, config }) => {
    return (
        <div className="flex w-full min-h-[100vh] items-center justify-center max-w-[430px]">
            <div className="relative w-full">
                <CardFrame
                    imgType="cloud"
                    config={config}
                />
                {children}
            </div>
        </div>
    );
});

const FileUpload = ({ handleImageUpload, isLoading, config }) => {
    return (
        <div className="next-button relative inline-flex items-center">
            <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                disabled={isLoading}
                aria-label="Upload image"
            />
            <button disabled={isLoading} type="button" style={{ cursor: "pointer"}}>
                <img
                    style={{ cursor: "pointer"}}
                    className="button-width"
                    src={config.buttons.uploadButton}
                    alt="upload button"
                />
            </button>
        </div>
    );
};

const ImageFrameMerger = ({
    config,
    onImageMerged,
    onSkip,
    onError,
    mbtiResult,
    recommendedLitter,
    catName,
}) => {
    const [uploadedImage, setUploadedImage] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [frameImage, setFrameImage] = useState(null);

    useEffect(() => {
        const loadFrameImage = async () => {
            try {
                if (config.result.upload[mbtiResult]) {
                    setIsLoading(true);
                    const response = await fetch(
                        config.result.upload[mbtiResult]
                    );
                    if (!response.ok) {
                        errorAlert("無法載入結果圖片，請重試");
                        // throw new Error("Failed to load frame image");
                    }

                    const blob = await response.blob();
                    const img = new Image();
                    img.crossOrigin = "anonymous";

                    img.onload = () => {
                        setFrameImage(img);
                        setIsLoading(false);
                    };

                    img.onerror = () => {
                        errorAlert("載入結果圖片失敗，請重試");
                        // throw new Error("Frame image loading failed");
                    };

                    img.src = URL.createObjectURL(blob);
                }
            } catch (err) {
                setError("Failed to load frame image");
                setIsLoading(false);
                console.error("Frame image loading error:", err);
            }
        };

        loadFrameImage();
    }, [config.result.upload[mbtiResult]]);

    const validateImage = (file) => {
        if (!file) {
            errorAlert("您沒有選擇檔案，請重試");
            // throw new SecurityError("No file selected");
        }

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            errorAlert("檔案格式有誤，請上傳 PNG 或 JPG");
            // throw new SecurityError(
            //   "Invalid file type. Please upload a JPG or PNG image."
            // );
        }

        if (file.size > MAX_FILE_SIZE) {
            errorAlert("照片太大了！最大尺寸為 100 MB");
            // throw new SecurityError("File too large. Maximum size is 5MB.");
        }
    };

    const handleImageUpload = async (event) => {
        try {
            setError(null);
            setIsLoading(true);

            const file = event.target.files[0];
            validateImage(file);

            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    setUploadedImage(img);
                    if (frameImage) {
                        mergeImages(img, frameImage);
                    }
                    setIsLoading(false);
                };

                img.onerror = () => {
                    // throw new Error("Failed to load uploaded image");
                    errorAlert("無法載入上傳的照片，請重試");
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                errorAlert("無法讀取檔案，請重試");
                // throw new Error("Failed to read file");
            };

            reader.readAsDataURL(file);
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
            console.error("Upload error:", err);
        }
    };

    const mergeImages = (userImage, frame) => {
        try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                errorAlert("Canvas 繪製失敗，請重試");
                // throw new Error("Canvas context not available");
                return;
            }

            canvas.width = CANVAS_WIDTH * CANVAS_SCALE;
            canvas.height = CANVAS_HEIGHT * CANVAS_SCALE;

            // 先填充白色背景
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 繪製使用者照片
            if (userImage) {
                const targetWidth = 120 * CANVAS_SCALE;
                const targetHeight = 125 * CANVAS_SCALE;
                const targetX = (canvas.width - targetWidth) / 2 + 90;
                const targetY = 80;

                // 創建一個臨時的canvas來處理使用者圖片的背景
                const tempCanvas = document.createElement("canvas");
                const tempCtx = tempCanvas.getContext("2d");
                tempCanvas.width = targetWidth;
                tempCanvas.height = targetHeight;

                // 在臨時canvas上填充白色背景
                tempCtx.fillStyle = "#FFFFFF";
                tempCtx.fillRect(0, 0, targetWidth, targetHeight);

                const scaleWidth = targetWidth / userImage.width;
                const scaleHeight = targetHeight / userImage.height;
                const scale = Math.min(scaleWidth, scaleHeight);

                const scaledWidth = userImage.width * scale;
                const scaledHeight = userImage.height * scale;

                const offsetX = (targetWidth - scaledWidth) / 2;
                const offsetY = (targetHeight - scaledHeight) / 2;

                // 在臨時canvas上繪製縮放後的圖片
                tempCtx.drawImage(
                    userImage,
                    offsetX,
                    offsetY,
                    scaledWidth,
                    scaledHeight
                );

                // 將臨時canvas的內容繪製到主canvas上
                ctx.drawImage(
                    tempCanvas,
                    targetX,
                    targetY,
                    targetWidth,
                    targetHeight
                );
            }
            // 2. 畫背景圖（根據是否有上傳照片選擇不同背景）
            const baseImage = new Image();
            baseImage.crossOrigin = "anonymous";
            baseImage.onload = () => {
                ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

                // 3. 畫貓砂
                if (recommendedLitter && config.litter[recommendedLitter]) {
                    const litterImage = new Image();
                    litterImage.crossOrigin = "anonymous";
                    litterImage.onload = () => {
                        const litterWidth = 100 * CANVAS_SCALE;
                        const litterHeight = 100 * CANVAS_SCALE;
                        const litterX = (canvas.width - litterWidth) / 2;
                        const litterY = canvas.height - litterHeight - 40 * CANVAS_SCALE;

                        ctx.drawImage(
                            litterImage,
                            litterX,
                            litterY,
                            litterWidth,
                            litterHeight
                        );

                        // 4. 最後加上文字
                        drawText();
                        const mergedUrl = canvas.toDataURL("image/png");
                        onImageMerged(mergedUrl);
                    };
                    litterImage.src = config.litter[recommendedLitter];
                } else {
                    // 沒有貓砂圖片時直接加上文字
                    drawText();
                    const mergedUrl = canvas.toDataURL("image/png");
                    onImageMerged(mergedUrl);
                }
            };

            baseImage.src = userImage
                ? config.result.upload[mbtiResult]
                : config.result.noUpload[mbtiResult];

            // 將文字繪製邏輯抽出來，避免重複
            function drawText() {
                ctx.font = `${18 * CANVAS_SCALE}px 'Noto Sans TC Rounded'`;
                ctx.fillStyle = "#000000";
                ctx.textAlign = "left";
                ctx.textBaseline = "top";

                const textX = 60 * CANVAS_SCALE;
                const textY = 60 * CANVAS_SCALE;
                const maxWidth = 250 * CANVAS_SCALE;
                const lineHeight = 26 * CANVAS_SCALE;

                const text = catName
                    ? `${catName} 性格\n代表的魔法物是...`
                    : `你的貓咪性格\n代表的魔法物是...`;
                const lines = text.split("\n");

                lines.forEach((line, index) => {
                    if (index < 3) {
                        ctx.fillText(
                            line,
                            textX,
                            textY + lineHeight * index,
                            maxWidth
                        );
                    }
                });
            }
        } catch (err) {
            setError("Failed to merge images");
            console.error("Merge error:", err);
        }
    };

    return (
        <CloudCard config={config}>
            <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center 
                  w-full px-8 flex flex-col items-center justify-center gap-6"
            >
                <h2 className="text-xl mb-6 whitespace-pre-line">
                    {`上傳一張 ${catName} 的\n可愛照片吧！`}
                </h2>
                <img
                    className="max-w-[200px] mx-auto"
                    src={config.crystalBall}
                    alt="crystal-ball"
                />
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => {
                            mergeImages(null, frameImage); // 在這邊呼叫 mergeImages
                            onSkip(); // 通知父組件關閉上傳介面
                        }}
                    >
                        <img
                            className="skip-button button-width"
                            src={config.buttons.skipButton}
                            alt="skip"
                        />
                    </button>
                    <FileUpload
                        handleImageUpload={handleImageUpload}
                        isLoading={isLoading}
                        config={config}
                    />
                </div>

                {error && <p className="text-red-500 mb-4">{error}</p>}
                {isLoading && <p>Loading...</p>}
            </div>
        </CloudCard>
    );
};

const ResultPage = memo(
    ({
        mbtiResult,
        recommendedLitter,
        mergedImageUrl,
        config,
        onRestart,
        catName,
    }) => {
        // const getLitterImage = (litterType) => {
        //   return config.litter[litterType];
        // };

        const [showConfirm, setShowConfirm] = useState(false);
        const [customPadding, setCustomPadding] = useState('16px');
        const [customImagePadding, setCustomImagePadding] = useState('16px');
        const [customWidth, setCustomWidth] = useState('320px');

        useEffect(() => {
          const handleResize = () => {
              setCustomPadding(window.innerWidth >= 500 ? '32px' : 
                window.innerWidth >= 400 ? '32px' : 
                window.innerWidth >= 382 ? '16px' :
                window.innerWidth >= 366 ?
                '8px' : 0);
          };
          const handleImageResize = () => {
            setCustomImagePadding(window.innerWidth >= 500 ? '24px' : 
            window.innerWidth >= 400 ? '8px' : 
            window.innerWidth >= 382 ? '4px' :
            window.innerWidth >= 366 ?
            '2px' : 0);
          }
          const handleWidth = () => {
            setCustomWidth(window.innerWidth >= 360 ? '350px' : '320px');
          }

          handleResize();
          handleImageResize();
          handleWidth();

          window.addEventListener('resize', handleResize);
          window.addEventListener('resize', handleImageResize);
          window.addEventListener('resize', handleWidth)

          return () =>{ 
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('resize', handleImageResize);
            window.removeEventListener('resize', handleWidth);
          }
        }, []);

        const handleShare = async () => {
            const catPersonality = config.catPersona[mbtiResult];

            try {
                if (navigator.share) {
                    await navigator.share({
                        title: '讀喵術：貓咪到底在"喵～"什麼？',
                        text: `我家 ${catName} 的讀喵結果是是：${catPersonality}！`,
                        url: window.location.href,
                    });
                }
            } catch (error) {
                console.error("Share Failed:", error);
            }
        };

        const handleRestartClick = () => {
            setShowConfirm(true);
        };

        const handleConfirmRestart = () => {
            setShowConfirm(false);
            onRestart();
        };

        const handleCloseConfirm = () => {
            setShowConfirm(false);
        };

        return (
            <div className="w-full flex flex-col items-center">
                <div className="relative w-full max-w-[430px] py-8 bg-[E0E0E0]"
                  style={{ padding: `32px ${customImagePadding}` }} 
                >
                    <div className="outcome-container relative rounded-[15px] overflow-hidden">
                        {mergedImageUrl ? (
                            <img
                                src={mergedImageUrl}
                                alt="outcome-image"
                                className="w-full max-w-[350px] mx-auto"
                            />
                        ) : (
                            <img
                                className="w-full max-w-[350px] mx-auto object-contain"
                                src={mbtiResult ? config.result.noUpload[mbtiResult] : config.result.noUpload["ESTJ"] }
                                alt="outcome-image-without-upload"
                            />
                        )}
                        {/* transparent link*/}
                        {recommendedLitter &&
                            config.litterLinks[recommendedLitter] && (
                                <div
                                    className="absolute bottom-[40px] left-1/2 transform -translate-x-1/2 w-[100px] h-[100px] cursor-pointer"
                                    onClick={() => window.open(config.litterLinks[recommendedLitter])}
                                />
                            )}
                    </div>
                </div>
                <div className="result-content flex flex-col justify-content items-center bg-[E0E0E0] max-w-[430px] w-full"
                style={{ padding: `0 ${customPadding}` }} 
                >
                    <div>
                        <img
                            className="mb-[20px]"
                            style={{ maxWidth: `${customWidth}`}}
                            src={config.result.outcomeHint}
                            alt="outcome-hint"
                        />
                    </div>

                    <div className="flex gap-[40px] mb-[30px]">
                        <button
                            onClick={handleRestartClick}
                            className="w-[140px]"
                        >
                            <img
                                className="restart-button"
                                src={config.buttons.restartButton}
                                alt="restart-button-image"
                            />
                        </button>
                        <button onClick={handleShare} className="w-[140px]">
                            <img 
                                className="share-button"
                                src={config.buttons.shareButton} 
                                alt="share-to-friends" />
                        </button>
                    </div>
                    <div>
                        <img
                            className="mb-[20px]"
                            style={{ maxWidth: `${customWidth}`}}
                            src={config.result.dashedDivider}
                            alt="divider-line"
                        />
                    </div>

                    <div className="lottery-rule-title flex items-center gap-1 mb-4">
                        <img
                            src={config.footprint}
                            alt="cat-icon"
                            width="20"
                            className="pt-[2px]"
                        />
                        {/* <h3 className="text-xl font-bold mb-4 text-center">抽獎辦法</h3> */}
                        <img
                            src={config.result.lotteryRuleTitle}
                            alt="cat-icon"
                            width="80"
                        />
                        <img
                            src={config.footprint}
                            alt="cat-icon"
                            width="20"
                            className="pt-[2px]"
                        />
                    </div>

                    <div
                        className="lottery-rule-content flex flex-col justify-center items-center align-center w-full max-w-[350px] 
                    border-2 border-black rounded-3xl bg-white mb-6 pt-3 pb-4 font-semibold text-sm"
                    >
                        <ol className="tracking-tight mb-4">
                            <li className="">
                                <span className="text-[14px]">1.</span>{" "}
                                將測驗結果分享至個人 IG 限時動態，並帶入心測連結
                            </li>
                            <li className="">
                                <span className="text-[14px]">2.</span> 於 IG
                                活動貼文下方留言心測結果推薦的貓砂款式<br></br>
                                例如「鐵鎚牌頂級低敏貓砂」並 Tag 一位好友
                            </li>
                        </ol>
                        <p className="text-center">
                            即可參加鐵鎚牌頂級貓砂抽獎活動
                            <br />
                            活動即日起至 2025/1/5 為止
                        </p>
                        <p className="text-purple-600 text-center mb-4 text-[#b39bf3]">
                            **中獎者再請提供限動截圖核對
                            <br />
                            即可免費領取貓砂（不指定款式）**
                        </p>
                        <div className="share-cat-personality-cta flex items-center gap-2">
                            <img
                                src={config.catIcon}
                                alt="cat-icon"
                                width="25"
                            />
                            {/* <h3 className="font-bold text-[16px] text-[#ab97f2]">快來分享你的貓主子性格吧~~</h3> */}
                            <img
                                src={config.result.shareCatPersonaCTA}
                                alt="share-cat-persona"
                                width="200"
                            />
                            <img
                                src={config.catIcon}
                                alt="cat-icon"
                                width="25"
                            />
                        </div>
                    </div>

                    <div className="channel-title flex items-center gap-1 mb-4">
                        <img src={config.footprint} alt="cat-icon" width="17" />
                        {/* <h3 className="text-xl font-bold mb-4 text-center">購買通路</h3> */}
                        <img
                            src={config.result.channelTitle}
                            alt="cat-icon"
                            width="80"
                        />
                        <img src={config.footprint} alt="cat-icon" width="17" />
                    </div>

                    <div
                        className="channel-content flex flex-col justify-center items-center align-center w-full max-w-[350px] 
                    border-2 border-black rounded-3xl bg-white mb-6 pt-3 pb-4 font-semibold text-sm"
                    >
                        <p className="text-center mb-6 tracking-tight">
                            實體購買通路:<br></br>
                            金吉利體系、愛狗生活館、寵物夢想屋（僅大興店、內壢店）、寵物反斗城、薇妮寵物、臭貓動物園（僅中和店）、
                            <br></br>Love pet
                        </p>

                        <h3 className="mb-4">線上購買通路：</h3>
                        <div className="flex justify-center gap-4">
                            <button
                                className="shop-button block w-[90px] pt-[4px] text-white rounded-xl text-center
                                bg-[#f305bd]"
                                onClick={() => window.open(config.links.MOMO)}
                                // style={{ backgroundColor: "f305bd" }}
                            >
                                <span
                                    className="leading-[1.25rem] text-[17px]"

                                >
                                    MOMO<br></br>
                                    購物網
                                </span>
                            </button>
                            <button
                                className="shop-button block w-[90px] pt-[4px] text-white rounded-xl text-center
                                bg-[#d7000f]"
                                onClick={() => window.open(config.links.PCHOME)}
                                // style={{ backgroundColor: "d7000f" }}
                            >
                                <span
                                    className="leading-[1.25rem] text-[17px]"
      
                                >
                                    24H<br></br>
                                    PCHOME
                                </span>
                            </button>
                            <div className="shop-button block w-[90px] bg-white text-black rounded-lg hover:bg-gray-50 text-center">
                                <button
                                  onClick={() => window.open(config.links.COUPANG)}
                                >
                                    <img
                                        src={config.buttons.coupangButton}
                                        alt="coupon"
                                        width="90px"
                                        className="w-full"
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="follow-facebook-title flex items-center gap-1 mb-4">
                        <img
                            src={config.footprint}
                            alt="footprint-icon-first"
                            width="18"
                            className=""
                        />
                        {/* <h3 className="text-xl font-bold mb-4 text-center">關注鐵鎚牌</h3> */}
                        <img
                            src={config.result.followArmAndHammerTitle}
                            alt="follow-facebook"
                            width="100"
                        />
                        <img
                            src={config.footprint}
                            alt="footprint-icon-last"
                            width="18"
                            className=""
                        />
                    </div>

                    <div
                        className="facebook-content flex flex-col justify-center items-center align-center w-full max-w-[350px] 
                    border-2 border-black rounded-3xl bg-white mb-10 pt-3 pb-4 font-semibold text-sm"
                    >
                        <div className="flex justify-center">
                            <button
                                className="shop-button"
                                onClick={() => window.open("https://www.facebook.com/armandhammerTAIWAN")}
                            >
                                <img
                                    src={config.buttons.facebookButton}
                                    alt="facebook-logo"
                                    width="50px"
                                />
                            </button>
                        </div>
                    </div>
                    <ConfirmDialog
                        isOpen={showConfirm}
                        onClose={handleCloseConfirm}
                        onConfirm={handleConfirmRestart}
                    />
                </div>
            </div>
        );
    }
);

const ConfirmDialog = memo(({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#FCDECF] p-6 rounded-lg border-2 border-[#402529] max-w-[300px] w-full mx-4">
                <h3 className="text-xl text-center mb-4">
                    結果將消失，請先儲存
                </h3>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onConfirm}
                        className="border-1 border:white px-6 py-2 bg-purple-200 hover:bg-purple-300 rounded-lg transition-colors"
                    >
                        跳轉
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                </div>
            </div>
        </div>
    );
});

const Footer = ({ config }) => {
    return (
        <footer className="w-full bg-black pt-2 pb-2">
            {/* <footer className="fixed bottom-0 left-0 w-full bg-black pt-2 pb-2 z-50"> */}
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-center">
                    <div className="flex items-center gap-1">
                        <div
                            className="cursor-pointer"
                            onClick={() => window.open(config.links.SUPERMEDIA)}
                        >
                            <img
                                src={config.superMediaLogoLink}
                                alt="super-media-logo"
                                className="w-[100px]"
                            />
                        </div>

                        <img
                            src={config.armAndHammerLogo}
                            alt="arm-&-hammer-logo"
                            className="w-[40px]"
                        />
                        <p className="text-[10px] text-white tracking-tighter">
                            Copyright © 2024. TTSHOW All Rights Reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const TestControls = ({ setIsLoading, setUploadError }) => {
    return (
        <div className="fixed top-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200">
            <h3 className="font-bold mb-2 text-sm">測試控制面板</h3>
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => setIsLoading((prev) => !prev)}
                    className="px-3 py-1 bg-blue-500 rounded hover:bg-blue-600 text-sm"
                >
                    切換 Loading 狀態
                </button>
                <button
                    onClick={() => setUploadError((prev) => !prev)}
                    className="px-3 py-1 bg-red-500 rounded hover:bg-red-600 text-sm"
                >
                    切換上傳失敗狀態
                </button>
            </div>
        </div>
    );
};

const App = () => {
    const [staticJson, setStaticJson] = useState(STORAGE_DATA);
    const QUESTIONS = staticJson.config.questions;

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
    const [answers, setAnswers] = useState({});
    const [mbtiResult, setMbtiResult] = useState("");
    const [recommendedLitter, setRecommendedLitter] = useState("");
    const [mergedImageUrl, setMergedImageUrl] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showImageUpload, setShowImageUpload] = useState(false);

    const [catName, setCatName] = useState("");
    const [showNameInput, setShowNameInput] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [uploadError, setUploadError] = useState(false);

    const handleRestart = useCallback( async() => {
      setIsLoading(true);
      try {
        //await new Promise(resolve => setTimeout(resolve, 1000));
        setCurrentQuestionIndex(-1);
        setAnswers({});
        setMbtiResult("");
        setRecommendedLitter("");
        setMergedImageUrl(null);
        setShowImageUpload(false);
        setUploadError(false);
        setCatName("");
        setShowNameInput(false);
      } finally {
        setIsLoading(false);
      }
    }, []);

    const handleStart = async() => {
      setIsLoading(true);
      try {
          //await new Promise(resolve => setTimeout(resolve, 1000));
          setShowNameInput(true);
          setCurrentQuestionIndex(-2); // 名字輸入頁面
      } finally {
          setIsLoading(false);
      }
    };

    // const handleUploadError = useCallback(() => {
    //     setUploadError(true);
    // }, []);

    const handleRetryUpload = useCallback(() => {
        setUploadError(false);
        setShowImageUpload(true);
    }, []);

    
    const handleSkipUpload = async () => {
        setIsLoading(true);
        try {
            //await new Promise(resolve => setTimeout(resolve, 1000));
            setShowImageUpload(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNameSubmit = useCallback(async (name) => {
      setIsLoading(true);
      try {
          //await new Promise(resolve => setTimeout(resolve, 1000));
          setCatName(name);
          setCurrentQuestionIndex(0); //第一題
      } finally {
          setIsLoading(false);
      }
  }, []);

    useEffect(() => {
        const checkDevice = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkDevice();
        window.addEventListener("resize", checkDevice);
        return () => window.removeEventListener("resize", checkDevice);
    }, []);

    const calculateMBTI = useCallback(() => {
        let mbtiCounts = {
            E: 0,
            I: 0,
            S: 0,
            N: 0,
            T: 0,
            F: 0,
            P: 0,
            J: 0,
        };

        Object.entries(answers).forEach(([questionId, answer]) => {
            const question = QUESTIONS[parseInt(questionId) - 1];
            if (question.mbtiA && answer === "A") {
                mbtiCounts[question.mbtiA]++;
            } else if (question.mbtiB && answer === "B") {
                mbtiCounts[question.mbtiB]++;
            }
        });

        const mbti = [
            mbtiCounts.E > mbtiCounts.I ? "E" : "I",
            mbtiCounts.S > mbtiCounts.N ? "S" : "N",
            mbtiCounts.T > mbtiCounts.F ? "T" : "F",
            mbtiCounts.P > mbtiCounts.J ? "P" : "J",
        ].join("");

        setMbtiResult(mbti);
    }, [answers]);

    const currentQuestionData = useMemo(() => {
        if (
            currentQuestionIndex < 0 ||
            currentQuestionIndex >= QUESTIONS.length
        ) {
            return null;
        }
        const question = QUESTIONS[currentQuestionIndex];
        return {
            ...question,
            text: question.text.replace("{catName}", catName),
        };
    }, [currentQuestionIndex, catName]);

    const handleAnswer = useCallback(
      async (answer) => {
        setIsLoading(true);
        try {
            //await new Promise(resolve => setTimeout(resolve, 1000));
            
            const currentQuestion = QUESTIONS[currentQuestionIndex];
            const newAnswers = { ...answers, [currentQuestion.id]: answer };
            setAnswers(newAnswers);

            if (currentQuestion.special) {
                if (answer === "A") setRecommendedLitter(currentQuestion.special);
            } else if (currentQuestion.specialA && answer === "A") {
                setRecommendedLitter(currentQuestion.specialA);
            } else if (currentQuestion.specialB && answer === "B") {
                setRecommendedLitter(currentQuestion.specialB);
            }

            // 進入結果之前上傳頁
            if (currentQuestionIndex === QUESTIONS.length - 1) {
                calculateMBTI();
                setShowImageUpload(true);
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            }
        } finally {
            setIsLoading(false);
        }
      },[currentQuestionIndex, answers, calculateMBTI]);

    // 處理合成後的圖片
    const handleImageMerged = useCallback(async (mergedUrl) => {
      setIsLoading(true);
      try {
          //await new Promise(resolve => setTimeout(resolve, 1000));
          setMergedImageUrl(mergedUrl);
          setShowImageUpload(false);
      } finally {
          setIsLoading(false);
      }
    }, []);

    if (isLoading) {
        return <LoadingPage config={staticJson.config} />;
    }

    if (uploadError) {
        return (
            <UploadErrorPage
                config={staticJson.config}
                onRetry={handleRetryUpload}
                onRestart={handleRestart}
            />
        );
    }

    if (currentQuestionIndex === -1) {
        return <StartPage config={staticJson.config} 
                          onStart={handleStart} 
                          currentQuestionIndex={currentQuestionIndex}
         />;
    }

    if (currentQuestionIndex === -2) {
        return (
            <NameInputPage
                config={staticJson.config}
                onSubmitName={handleNameSubmit}
            />
        );
    }

    if (currentQuestionIndex < QUESTIONS.length && currentQuestionIndex >= 0) {
        return (
            <QuestionPage
                currentQuestion={currentQuestionData}
                onAnswer={handleAnswer}
                config={staticJson.config}
                catName={catName}
            />
        );
    }

    if (showImageUpload) {
        return (
            <ImageFrameMerger
                config={staticJson.config}
                onImageMerged={handleImageMerged}
                onSkip={handleSkipUpload}
                mbtiResult={mbtiResult}
                recommendedLitter={recommendedLitter}
                catName={catName}
            />
        );
    }

    return (
        <div className="flex flex-col w-full">
            <main className="flex flex-col items-center">
                <section className="w-full text-center">
                    {/* <TestControls
                        setIsLoading={setIsLoading}
                        setUploadError={setUploadError}
                    /> */}
                    <ResultPage
                        mbtiResult={mbtiResult}
                        recommendedLitter={recommendedLitter}
                        mergedImageUrl={mergedImageUrl}
                        config={staticJson.config}
                        onRestart={handleRestart}
                        catName={catName}
                    />
                    <Footer config={staticJson.config} />
                </section>
            </main>
        </div>
    );
};

ReactDOM.render(<App />, document.querySelector("#root"));
