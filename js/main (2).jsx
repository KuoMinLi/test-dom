import React, {
    cloneElement,
    createContext,
    useMemo,
    useContext,
    useState,
    useEffect,
    useRef,
} from "https://esm.sh/react@18.2.0";
import ReactDOM, { createPortal } from "https://esm.sh/react-dom@18.2.0";
import YouTube from "https://esm.sh/react-youtube";
// const { React } = window;
// const {
//     cloneElement,
//     createContext,
//     useMemo,
//     useContext,
//     useState,
//     useEffect,
//     useRef,
//     createPortal,
// } = React;

import Ebm from "https://cdn.jsdelivr.net/npm/fix-webm-duration@1.0.5/+esm";
import * as Marquee from "https://esm.sh/react-fast-marquee@1.6.0";
import * as AlertDialog from "https://esm.sh/@radix-ui/react-dialog@1.0.4";

const RECORDING_SUBMIT_STAT = {
    success: "success",
    error: "error",
};

const dynamicJsonDefault = {
    isMobile: null,
    recordingId: 0,
    videoUrl: null,
    posts: {},
};

const mediaRecorder = {
    instance: null,
    audioData: [],
};
/* ===============================================================================
 * Data storage
 * ================================================================================
 */
const StorageContext = createContext(undefined);

const StorageProvider = ({ children }) => {
    const [staticJson, setStaticJson] = useState(null);
    const [dynamicJson, setDynamicJson] = useState(dynamicJsonDefault);

    useEffect(() => {
        setStaticJson(STORAGE_DATA);
        // fetchGetApi({ url: STORAGE_DATA_URL }).then((r) => setStaticJson(r));
    }, [STORAGE_DATA]);

    const resetDynamicData = (key, value) => {
        setDynamicJson((prev) => ({ ...prev, [key]: value }));
    };

    const storageContextData = useMemo(() => {
        return [staticJson, dynamicJson, resetDynamicData];
    }, [dynamicJson, resetDynamicData, staticJson]);

    if (!staticJson) return <div></div>;

    return (
        <StorageContext.Provider value={storageContextData}>
            {children}
        </StorageContext.Provider>
    );
};

/* ===============================================================================
 * Utils functions
 * ================================================================================
 */
const browserIsChrome = () => navigator.userAgent.indexOf("Chrome") != -1;
const checkIsMobile = (w) => w <= 964;

const businessSuccess = (payload) =>
    payload.code === 200 && payload.status === 200;
const fetchGetApi = ({ url, params = {}, isSuccess = () => true }) => {
    if (params && Object.keys(params).length > 0) {
        url += "?" + new URLSearchParams(params).toString();
    }
    return new Promise((resolver, rejector) => {
        fetch(url)
            .then((response) => response.json())
            .then((json) =>
                isSuccess(json) ? resolver(json) : rejector(json)
            );
    });
};
const fetchPostApi = ({ url, params, isSuccess = () => true }) => {
    return new Promise((resolver, rejector) => {
        fetch(url, { method: "POST", body: params })
            .then((response) => {
                console.log("r", url, response);

                return response.json();
            })
            .then((json) => (isSuccess(json) ? resolver(json) : rejector(json)))
            .catch((e) => rejector(e));
    });
};
const makeFormData = (data) => {
    const fd = new FormData();
    Object.keys(data).forEach((key) => fd.append(key, data[key]));
    return fd;
};
const objNotEmpty = (data) => {
    return Object.values(data).every((value) => value);
};
const fileOutOfRange = (size, maxMb) => size / 1024 / 1000 > maxMb;
const blobToFile = (theBlob, fileName = "recording") => {
    return new File([theBlob], fileName, {
        lastModified: new Date().getTime(),
        type: theBlob.type,
    });
};

const copyToClipboard = (text) => navigator.clipboard.writeText(text);

const startAudio = () => {
    const type = browserIsChrome() ? "audio/webm;codecs=opus" : "audio/mp4";

    let startTime;

    navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then((stream) => {
                    mediaRecorder.instance = new MediaRecorder(stream);
                    mediaRecorder.instance.start();
                    startTime = Date.now();

                    mediaRecorder.instance.addEventListener(
                        "dataavailable",
                        (ev) => {
                            mediaRecorder.audioData.push(ev.data);
                        }
                    );

                    mediaRecorder.instance.addEventListener("stop", () => {
                        const duration = Date.now() - startTime;
                        const blobData = new Blob(mediaRecorder.audioData, {
                            type,
                        });

                        Ebm(blobData, duration, function (fixedBlob) {
                            mediaRecorder.audioData = fixedBlob;
                        });
                    });
                })
                .catch((info) => {
                    console.log("no access to use audio", info);
                });
        })
        .catch((err) => {
            console.log("nonono ~~~ !!");
        });
};

let totalSeconds = 0;
const startTimer = (setClock, setStopAction, maxDurtion) => {
    totalSeconds = 0;
    return setInterval(() => {
        setClock(counter(setStopAction, maxDurtion));
    }, 1000);
};

const counter = (setStopAction, maxDurtion) => {
    ++totalSeconds;

    let hour = Math.floor(totalSeconds / 3600);
    let minute = Math.floor((totalSeconds - hour * 3600) / 60);
    let seconds = totalSeconds - (hour * 3600 + minute * 60);

    if (hour < 10) hour = "0" + hour;
    if (minute < 10) minute = "0" + minute;
    if (seconds < 10) seconds = "0" + seconds;

    if (seconds >= 15) setStopAction();

    return [hour, minute, seconds];
};

/* ===============================================================================
 * Component
 * ================================================================================
 */

const Dialog = ({
    content,
    onConfirm = () => {},
    onClose = () => {},
    confirmText = "確認",
}) => {
    return (
        <AlertDialog.Root defaultOpen={true}>
            <AlertDialog.Content className="AlertDialogContent w-[370px] p-[34px] bg-white border-2 border-primary rounded-3xl">
                <AlertDialog.Description
                    className="AlertDialogDescription text-base font-light mt-3 leading-7"
                    dangerouslySetInnerHTML={{ __html: content }}
                ></AlertDialog.Description>
                <div className="flex gap-[25px] justify-end">
                    {confirmText && (
                        <AlertDialog.Close
                            asChild
                            onClick={() => onConfirm && onConfirm()}
                        >
                            <button className="Button cursor-pointer px-[30px] py-[10px] bg-primary text-white m-auto">
                                {confirmText}
                            </button>
                        </AlertDialog.Close>
                    )}
                </div>
                <AlertDialog.Close
                    asChild
                    onClick={() => onClose && onClose(true)}
                >
                    <div className="absolute cursor-pointer top-6 right-5 w-[22px]">
                        <img
                            src="summergarden2023/images/cross.png"
                            alt="close"
                        />
                    </div>
                </AlertDialog.Close>
            </AlertDialog.Content>
        </AlertDialog.Root>
    );
};

const Modal = ({ children, options = {} }) => {
    const modalRef = useRef(null);
    const [isOpen, setIsOpen] = useState(true);

    const Portal = ({ children }) => {
        return createPortal(children, document.body);
    };
    const recoverScroll = () => (document.body.style.overflow = "auto");

    const closeModal = async () => {
        const modal = modalRef.current;

        const removeSelf = () => {
            recoverScroll();
            modal.remove();
        };

        const milliseconds = 500;
        if (modal) setTimeout(removeSelf, milliseconds);
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div
                className="relative z-10"
                ref={modalRef}
                isOpen={isOpen}
                {...options}
            >
                <div
                    className="relative overflow flex-col flex items-center justify-center"
                    isOpen={isOpen}
                    {...options}
                >
                    {cloneElement(children, { ...children.props, closeModal })}
                </div>
            </div>
        </Portal>
    );
};

const openModal = (component) => {
    const newElement = document.createElement("div");
    ReactDOM.render(<Modal>{component}</Modal>, newElement);
    document.body.appendChild(newElement);
};

const SoundRecordSubmit = ({ onPrev }) => {
    const [submitStat, setSubmitStat] = useState(null);
    const [storage, { recordingId, videoUrl }] = useContext(StorageContext);
    const config = storage.config;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
        recording_id: recordingId,
    });

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [submitStat]);

    const onInputChange = (e, key) => {
        setFormData((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const handleOnNext = async () => {
        if (loading && !objNotEmpty(formData)) return;

        setLoading(true);

        try {
            const res = await fetchPostApi({
                url: apiHost + `/info`,
                params: makeFormData(formData),
                isSuccess: businessSuccess,
            });
            setSubmitStat(RECORDING_SUBMIT_STAT.success);
        } catch (e) {
            // const payload = res.data && Object.values(payload) || null;
            // if (payload && Array.isArray(payload)) {
            //   openModal(<Dialog content={payload[0]} confirmText="繼續填寫" />)
            // }
            setSubmitStat(RECORDING_SUBMIT_STAT.error);
        } finally {
            setLoading(false);
        }
    };

    const canGoNext = () => {
        if (!objNotEmpty(formData)) return false;
        return true;
    };

    return (
        <div className="inline-flex flex-row center md:flex-col md:items-center md:mb-24">
            <div className="relative w-[264px] h-[470px] border border-primary flex flex-col justify-center items-center md:mb-10">
                <video
                    className=""
                    autoplay="autoplay"
                    loop
                    muted
                    playsinline
                    controls
                >
                    <source src={videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
            {submitStat === null && (
                <div className="text-center ml-10 w-[320px] md:ml-0">
                    <b className="block text-[24px] mb-5 text-left text-primary">
                        填寫抽獎資料
                    </b>
                    <form className="flex flex-col space-y-6">
                        <input
                            className="input-control"
                            placeholder="請輸入姓名"
                            defaultValue={formData.name}
                            required
                            maxlength="30"
                            onChange={(e) => onInputChange(e, "name")}
                        />
                        <input
                            className="input-control"
                            placeholder="請輸入電話"
                            defaultValue={formData.phone}
                            required
                            maxlength="30"
                            onChange={(e) => onInputChange(e, "phone")}
                        />
                        <input
                            className="input-control"
                            placeholder="請輸入e-mail"
                            defaultValue={formData.email}
                            required
                            maxlength="30"
                            onChange={(e) => onInputChange(e, "email")}
                        />
                        <input
                            className="input-control"
                            placeholder="請輸入地址"
                            defaultValue={formData.address}
                            required
                            maxlength="30"
                            onChange={(e) => onInputChange(e, "address")}
                        />
                        <p className=" font-light text-left leading-8 text-base">
                            分享錄音帶至告白河道與個人之 IＧ，並 tag ＠girlstalk 官方帳號者，即有機會獲得涼夏•夏日之歌限量禮包。
                        </p>
                        <div className="flex flex-row space-x-4">
                            <a
                                href={videoUrl}
                                target="_blank"
                                className="flex justify-center items-center border-primary bg-white border-2 text-primary w-full h-[44px]"
                                download
                            >
                                儲存錄音內容
                            </a>
                            {!loading && (
                                <button
                                    className={`${
                                        canGoNext()
                                            ? "bg-primary"
                                            : "bg-[#9B9FCF]"
                                    } text-white w-full h-[44px]`}
                                    disabled={!canGoNext()}
                                    onClick={handleOnNext}
                                >
                                    送出個人資料
                                </button>
                            )}
                            {loading && (
                                <button className="bg-primary text-white w-full h-[44px]">
                                    送出中...
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}
            {submitStat === RECORDING_SUBMIT_STAT.success && (
                <div className="text-center ml-10 w-[320px] md:ml-0">
                    <b className="block text-[24px] mb-5 text-left text-primary">
                        送出資料成功
                    </b>
                    <p className="text-[20px] font-light leading-8 text-left">
                        恭喜您完成抽獎登記
                        <br />
                        獎項將於 2023/9/8 前統一抽出
                        <br />
                        <br />
                        記得分享錄音帶內容至個人 ig
                        <br />
                        並 tag @girlstalk 官方帳號才可以抽獎哦!
                    </p>
                    <div className="flex flex-row w-full mt-10 space-x-4">
                        <a
                            href={videoUrl}
                            target="_blank"
                            className="flex justify-center items-center w-full bg-primary text-white h-[44px]"
                            download
                        >
                            儲存錄音內容
                        </a>
                        <button
                            className="w-full border-primary border-2 text-primary bg-white h-[44px]"
                            onClick={() => location.reload()}
                        >
                            完成
                        </button>
                    </div>
                </div>
            )}
            {submitStat === RECORDING_SUBMIT_STAT.error && (
                <div className="flex flex-col justify-center text-center ml-10 w-[320px] md:ml-0">
                    <b className="block text-[24px] mb-5 text-left text-primary">
                        送出資料失敗
                    </b>
                    <p className="text-[20px] font-light leading-8 text-left">
                        表單填寫失敗
                        <br />
                        在檢查看看是不是有漏寫的哦!
                    </p>
                    <div className="flex flex-row w-full mt-10 space-x-4">
                        <button
                            className="border-primary border-2 text-primary bg-white h-[44px] w-[158px]"
                            onClick={() => setSubmitStat(null)}
                        >
                            下一步
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

let recordTimer = null;

const SoundRecordPreSubmit = ({ onPrev, setSubmit }) => {
    const [storage, _, resetDynamicData] = useContext(StorageContext);
    const [previewImg, setPreviewImg] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [clock, setClock] = useState(null);
    const [recordFile, setRecordFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        producer: "",
        title: "",
        photo: null,
    });

    const config = storage.config;

    const triggerFileChange = () => {
        const target = document.getElementById("avatar-uploader");
        target && target.click();
    };

    const handleUploadAvatar = async (e) => {
        const file = e.target.files[0];
        if (fileOutOfRange(file.size, config.photoSizeLimit)) {
            console.log("photo is out of range", file.size);
            openModal(
                <Dialog
                    content="oops!! 圖片尺寸太大囉! <br/>請選擇小於5MB的圖!"
                    onConfirm={triggerFileChange}
                    confirmText="重新選圖"
                />
            );
            return;
        }

        const data = URL.createObjectURL(file);
        setPreviewImg(data);
        setFormData((prev) => ({ ...prev, photo: file }));
    };

    const resetRecord = () => {
        setIsRecording(false);
        clearInterval(recordTimer);
    };

    const handleOnRecording = () => {
        if (recordFile) return;
        if (isRecording) {
            if (clock[2] >= config.audioDurationSecMin) handleOnDone();
            return;
        }
        resetRecord();
        setIsRecording(true);
        startAudio();

        recordTimer = startTimer(
            setClock,
            handleOnDone,
            config.audioDurationSecMax
        );
    };

    const handleOnDone = () => {
        if (mediaRecorder.instance) mediaRecorder.instance.stop();
        setTimeout(() => {
            if (mediaRecorder.audioData !== null) {
                if (
                    fileOutOfRange(
                        mediaRecorder.audioData.size,
                        config.audioSizeLimit
                    )
                ) {
                    console.log(
                        "recording is out of range",
                        mediaRecorder.audioData.size
                    );
                    return;
                }
                setRecordFile(mediaRecorder.audioData);
            }
            setFormData((prev) => ({ ...prev }));
            resetRecord();
        }, 100);
    };

    const handleOnReRecord = () => {
        setPreviewImg(null);
        setRecordFile(null);
        setClock(null);
        resetRecord();
    };

    const onInputChange = (e, key) => {
        setFormData((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const handleOnNext = async () => {
        if (loading && !objNotEmpty(formData)) return;

        setLoading(true);
        console.log(recordFile);

        const postFormData = {
            ...formData,
            recording: blobToFile(recordFile),
            recording_sec: clock[2],
        };
        console.log("formData", postFormData);

        try {
            const res = await fetchPostApi({
                url: apiHost + `/recording`,
                params: makeFormData(postFormData),
                isSuccess: businessSuccess,
            });

            resetDynamicData("recordingId", res.data.recoding_id);
            resetDynamicData("videoUrl", res.data.video_url);
            setSubmit(true);
        } catch (e) {
            openModal(
                <Dialog
                    content="Ooooops! 看來你的表白太熱烈，我們系統眼前一片黑了(●´∞`●) 剛剛的動作再麻煩你重新操作一次哦！"
                    confirmText=""
                />
            );
        } finally {
            setLoading(false);
        }
    };

    const canGoNext = () => {
        if (!objNotEmpty(formData) || !previewImg || !recordFile) return false;
        return true;
    };

    return (
        <div className="SoundRecordPreSubmit">
            <ul className="step flex flex-row max-screen center px-16 md:flex-col md:items-center md:px-0">
                <li>
                    <b>Step1</b>
                    <span className="text-blacklight">請先詳閱活動規則</span>
                    <a
                        href={config.giftHost + "#explan"}
                        target="_blank"
                        className="w-[125px] h-[44px] bg-primary font-bold text-white flex items-center justify-center"
                    >
                        去看看
                    </a>
                </li>
                <li>
                    <b>Step2</b>
                    <span className="text-blacklight">
                        錄製你的專屬告白錄音帶，並填寫基本資料。
                    </span>
                </li>
                <li>
                    <b>Step3</b>
                    <span className="text-blacklight">
                        分享錄音帶至告白河道與個人之 IＧ，並 tag ＠girlstalk 官方帳號者，即有機會獲得涼夏•夏日之歌限量禮包。
                    </span>
                </li>
            </ul>
            <div className="inline-flex flex-row mt-14 md:flex-col">
                <section className="flex space-x-8 md:flex-col md:space-x-0 md:space-y-8 md:items-center">
                    <label
                        for="avatar-uploader"
                        className="cursor-pointer circle-control overflow-hidden flex items-center"
                    >
                        <input
                            id="avatar-uploader"
                            className="hidden"
                            type="file"
                            onChange={handleUploadAvatar}
                        />
                        {previewImg && (
                            <div className="w-full h-full">
                                <div
                                    className="responsive-image"
                                    style={{ "--h": 1, "--w": 1 }}
                                >
                                    <img src={previewImg} alt="" />
                                </div>
                            </div>
                        )}
                        {!previewImg && (
                            <div className="space-y-5">
                                <span className="block">
                                    點擊即可上傳大頭照
                                </span>
                                <img
                                    className="block w-[48px] m-auto"
                                    src={config.recordControlImg}
                                    alt=""
                                />
                                <span className="block">圖片預覽區</span>
                            </div>
                        )}
                    </label>
                    <label
                        className="cursor-pointer circle-control space-y-5"
                        onClick={handleOnRecording}
                    >
                        <span>
                            {(clock && clock.join(":")) || "點擊開始錄音"}
                        </span>
                        <img
                            className="w-[38px]"
                            src={config.recordControlMicro}
                            alt=""
                        />
                        {isRecording &&
                            clock &&
                            clock[2] < config.audioDurationSecMin && (
                                <span>
                                    請錄製至 {config.audioDurationSecMin} 秒哦!
                                </span>
                            )}
                        {isRecording &&
                            clock &&
                            clock[2] >= config.audioDurationSecMin &&
                            clock[2] <= config.audioDurationSecMax && (
                                <span>點擊完成錄音</span>
                            )}
                        {!isRecording && recordFile && <span>錄音完成</span>}
                    </label>
                </section>
                <section className="flex ml-14 md:ml-0 md:mt-14 md:mb-24">
                    <form className="flex flex-col space-y-6 w-[260px]">
                        <input
                            className="input-control"
                            placeholder="請輸入錄音帶製作人名稱"
                            maxlength="30"
                            required
                            onChange={(e) => onInputChange(e, "producer")}
                        />
                        <input
                            className="input-control"
                            placeholder="為你的錄音帶取名"
                            maxlength="30"
                            required
                            onChange={(e) => onInputChange(e, "title")}
                        />
                        <div className="flex flex-row w-full space-x-4">
                            <button
                                className="border-2 border-primary bg-white text-primary w-full h-[44px]"
                                type="button"
                                onClick={handleOnReRecord}
                            >
                                重新錄製
                            </button>
                            {!loading && (
                                <button
                                    className={`${
                                        canGoNext()
                                            ? "bg-primary"
                                            : "bg-[#9B9FCF]"
                                    } text-white w-full h-[44px]`}
                                    disabled={!canGoNext()}
                                    onClick={handleOnNext}
                                >
                                    下一步
                                </button>
                            )}
                            {loading && (
                                <button className="bg-primary text-white w-full h-[44px]">
                                    上傳中...
                                </button>
                            )}
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
};
const SoundRecord = ({ setDisplay }) => {
    const [storage] = useContext(StorageContext);
    const [submit, setSubmit] = useState(false);
    const mainEntryDisplay = storage.mainEntryDisplay;
    const config = storage.config;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [submit]);

    return (
        <div className="SoundRecord w-full h-full flex flex-col justify-center items-center">
            <div className="relative">
                <div className="block-title mb-8 md:pt-20">
                    <img
                        className="w-[388px] md:w-[348px] m-auto "
                        src={config.recordTitle}
                        alt="recordTitle"
                    />
                </div>
                {!submit && (
                    <SoundRecordPreSubmit
                        onPrev={() => setDisplay(mainEntryDisplay.gift)}
                        setSubmit={setSubmit}
                    />
                )}
                {submit && <SoundRecordSubmit />}
            </div>
        </div>
    );
};

const Permission = ({ onPrev, onNext }) => {
    return (
        <div className="max-w-[380px] flex flex-col md:w-[70%]">
            <h1 className="text-xl text-left text-black font-bold mt-8 m-auto md:text-xl">
                版權說明
            </h1>
            <p className="mt-3 mb-5 text-left text-base tracking-[1.5px] leading-8 md:font-light h-[128px] overflow-y-auto">
                (1)上傳之錄音檔，需保證未有侵犯他人著作權隱私權之行為，若有侵犯他人著作權及隱私權之事實時，上傳者需負完全責任。若有違反疑義，本平台得下架該音檔。
                <br />
                (2)參加本活動即同意授權本公司於本活動公開音檔並轉發。
                <br />
                (3)參加本活動即同意接受本活動辦法與注意事項之規範，如有違反，主辦單位得取消中獎資格，不同意本活動辦法或注意事項者請勿參加。
            </p>
            <div className="flex flex-row space-x-6 md:mb-6">
                <button
                    className="bg-white border-2 border-primary h-[60px] w-full text-[16px] text-primary md:h-[48px]"
                    onClick={onPrev}
                >
                    不同意
                </button>
                <button
                    className="bg-primary h-[60px] text-[16px] w-full text-white md:h-[48px]"
                    onClick={onNext}
                >
                    同意
                </button>
            </div>
        </div>
    );
};

const Stage = ({ onNext }) => {
    const [storage] = useContext(StorageContext);
    const config = storage.config;

    return (
        <>
            <h1 className="text-3xl font-medium mt-5 text-center md:flex md:justify-center">
                <span className="md:hidden">＃表白不用上頂樓</span>
                <img
                    className="hidden md:block md:w-[50%]"
                    src={config.mainSubTitleM}
                    alt="subtitle"
                />
            </h1>
            <p className="max-w-[380px] my-8 text-left text-base text-blacklight tracking-[1.5px] leading-8 md:w-[68%] md:text-[14px] md:leading-[28px] md:my-5 md:font-light">
                2023年涼夏特企，將以夏日之歌來揭開序幕在你心中，是否有一段迴盪在腦海中的旋律？！又或是有一首餘音繚繞揮之不去的歌曲？！跟著我們，一起展開啟你的夏日之歌吧！
            </p>
            <button
                className="bg-primary h-[60px] w-[265px] text-base text-white md:mb-6"
                onClick={onNext}
            >
                start
            </button>
        </>
    );
};

const MainPage = ({ children }) => {
    const [storage, { isMobile }] = useContext(StorageContext);
    const config = storage.config;
    const gifts = storage.block.gift.slice(0, 3);

    return (
        <div className="MainPage flex flex-row h-full md:flex-col-reverse md:h-auto">
            <div className="absolute left-0 bottom-16 z-10 md:hidden">
                <div className="relative gift-guide h-[165px] w-[405px] p-5 bg-primary rounded-r-[40px]">
                    <div className="pr-10">
                        <span className="block text-white text-[16px] mb-2.5">
                            驚喜好禮 告白就送給你
                        </span>
                        <div className="gift-items space-x-5 flex flex-row">
                            {gifts &&
                                gifts.map((gift, key) => (
                                    <div className="w-[90px] h-[90px]">
                                        <label
                                            className="flex responsive-image rounded-full"
                                            key={key}
                                            style={{ "--h": 1, "--w": 1 }}
                                        >
                                            <img
                                                src={gift.img}
                                                style={{
                                                    maxWidth: "150%",
                                                    width: "150%",
                                                }}
                                            />
                                        </label>
                                    </div>
                                ))}
                        </div>
                    </div>
                    <a
                        href={config.giftHost}
                        target="_blank"
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2  flex flex-col justify-center items-center text-base mb-2.5 text-[#000000] bg-yellow w-[92px] h-[92px] rounded-full"
                    >
                        <span>看看</span>
                        <span>好禮</span>
                    </a>
                </div>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 flex flex-row justify-center w-full md:relative md:flex-col md:top-0 md:-translate-y-0">
                <section className="relative -ml-20 md:ml-0 md:flex md:justify-center md:mt-10">
                    <div className="md:relative md:px-5">
                        <img
                            className="main-recorder-img w-[696px] md:w-full"
                            src={
                                isMobile
                                    ? config.mainRecorderM
                                    : config.mainRecorder
                            }
                            alt="recorder"
                        />
                        <img
                            className="animate-spin-slow absolute z-0 w-[210px] top-[162px] left-[110px] md:top-[27%] md:left-[51%] md:w-[25%]"
                            src={config.mainRecorderCircle}
                            alt="recorder-circle"
                        />
                        <img
                            className="animate-spin-slow absolute z-0 w-[210px] top-[162px] left-[342px] md:top-[27%] md:left-[23%] md:w-[25%]"
                            src={config.mainRecorderCircle}
                            alt="recorder-circle"
                        />
                        <img
                            className="absolute top-0 left-0 z-5 md:px-5"
                            src={config.mainRecorderMsg}
                            alt="recorder-message"
                        />
                    </div>
                </section>

                <section className="ml-8 flex flex-col md:-mt-4 items-center justify-center text-black md:ml-0">
                    <div className="w-[330px] md:w-[50%]">
                        <img src={config.mainTitle} alt="title" />
                    </div>
                    {children}
                </section>
            </div>
        </div>
    );
};

/* ===============================================================================
 * Container
 * ================================================================================
 */

const NavigationBar = () => {
    const [storage, { isMobile }] = useContext(StorageContext);
    const [open, setOpen] = useState(false);
    const [mOpen, setMOpen] = useState(false);
    const navMenu = storage.navMenu;
    const config = storage.config;

    /**
     * @param {Object} menu
     * schema: constant > navMenu
     */
    const handleOnClick = (menu) => {
        console.log("click menu: " + menu.id);
        handleOnClose();
    };

    const handleOnOpen = () => {
        setMOpen(true);
        setOpen(true);
    };
    const handleOnClose = () => {
        setMOpen(false);

        setTimeout(() => {
            setOpen(false);
        }, 500);
    };

    return (
        <>
            {isMobile && (
                <div
                    className="fixed top-6 cursor-pointer left-6 w-[64px] ss:block z-20 "
                    onClick={handleOnOpen}
                >
                    <img src={storage.config.hamburger} alt="hamburger" />
                </div>
            )}
            <nav
                className={`NavigationBar fixed z-30 top-0 text-[16px] text-[#ffffff] w-full bg-primary px-[48px] ss:flex-col ss:justify-between ss:items-start ss:p-[50px] ${
                    isMobile ? "isMobile" : ""
                } ${isMobile && open && mOpen ? "open" : ""}`}
            >
                {isMobile && open && (
                    <div
                        className="hidden absolute top-9 right-9 w-[64px] cursor-pointer ss:block"
                        onClick={handleOnClose}
                    >
                        <img src={storage.config.close} alt="close" />
                    </div>
                )}
                {(isMobile && open) || !isMobile ? (
                    <>
                        <div className="flex w-full flex-row items-center justify-between ss:flex-col ss:items-start ss:justify-normal">
                            <img
                                className="w-[186px] hidden ss:block ss:mb-12"
                                src={storage.config.mainTitleWhite}
                                alt="title"
                            />
                            <a href={config.baseUrl}>
                                <div className="w-[122px] mx-4 ss:hidden">
                                    <img
                                        src={storage.config.logo}
                                        alt="logo"
                                    ></img>
                                </div>
                            </a>

                            <ul className="menu flex flex-row mx-4 text-base ss:flex-col ss:mx-0 ss:text-xl ss:text-left">
                                {navMenu &&
                                    navMenu.map(
                                        (v, k) =>
                                            !v.hide && (
                                                <a
                                                    href={`#${v.id}`}
                                                    onClick={() =>
                                                        handleOnClick(v)
                                                    }
                                                >
                                                    {v.name}
                                                </a>
                                            )
                                    )}
                            </ul>
                        </div>
                        <a href={config.baseUrl}>
                            <div className="hidden w-[115px] ss:block">
                                <img src={storage.config.logo} alt="logo"></img>
                            </div>
                        </a>
                    </>
                ) : null}
            </nav>
        </>
    );
};

const MainEntryRoute = () => {
    const [storage] = useContext(StorageContext);
    const mainEntryDisplay = storage.mainEntryDisplay;

    const [display, setDisplay] = useState(mainEntryDisplay.default);
    const { config } = storage;

    useEffect(() => {
        if (window.location.hash) {
            const entrypoint = window.location.hash.replace("#", "");
            if (typeof mainEntryDisplay[entrypoint] !== "undefined")
                setDisplay(entrypoint);
        }
    }, [window.location.hash]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [display]);

    return (
        <div
            id="sound-record"
            className="MainEntryPage relative overflow-hidden"
        >
            <div className="md:hidden">
                <img
                    className="absolute w-[250px] top-0 left-0"
                    src={config.mainBgTL}
                    alt=""
                />
                <img
                    className="absolute w-[250px] top-0 right-0"
                    src={config.mainBgTR}
                    alt=""
                />
                <img
                    className="absolute w-[250px] bottom-0 left-0"
                    src={config.mainBgBL}
                    alt=""
                />
                <img
                    className="absolute w-[250px] bottom-0 right-0"
                    src={config.mainBgBR}
                    alt=""
                />
            </div>
            <div className="relative z-10 min-w-full">
                {display === mainEntryDisplay.default && (
                    <MainPage>
                        <Stage
                            onNext={() =>
                                setDisplay(mainEntryDisplay.permission)
                            }
                        />
                    </MainPage>
                )}
                {display === mainEntryDisplay.record && (
                    <SoundRecord
                        onPrev={() => setDisplay(mainEntryDisplay.default)}
                        setDisplay={setDisplay}
                    />
                )}
                {display === mainEntryDisplay.permission && (
                    <MainPage>
                        <Permission
                            onPrev={() => setDisplay(mainEntryDisplay.default)}
                            onNext={() => setDisplay(mainEntryDisplay.record)}
                        />
                    </MainPage>
                )}
            </div>
        </div>
    );
};

let audioInstance = null;

const ShareRiver = () => {
    const [storage] = useContext(StorageContext);
    const [recordings, setRecordings] = useState([]);
    const [soundId, setSoundId] = useState(null);
    const config = storage.config;

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!soundId) pauseIfWork();
    }, [soundId]);

    const fetchData = async () => {
        try {
            const res = await fetchGetApi({
                url: apiHost + "/recording",
                onSuccess: businessSuccess,
            });
            setRecordings(res.data);
        } catch (e) {
            console.log("Cannot get article data");
        }
    };

    const pauseIfWork = () => {
        audioInstance && audioInstance.pause();
    };

    const handleOnClick = (url, id) => {
        if (soundId === id) {
            pauseIfWork();
            setSoundId(null);
            return;
        }
        pauseIfWork();

        audioInstance = new Audio(url);
        audioInstance.play();
        audioInstance.addEventListener("ended", (e) => {
            setSoundId(null);
        });
        setSoundId(id);
    };

    const getRiverCount = () => {
        const l = recordings.length;
        const first = Math.max(l / 2);
        const secondRiver = recordings.slice(first * -1);
        const firstRiver = recordings.filter((x) => !secondRiver.includes(x));
        return [firstRiver, secondRiver];
    };

    const rivers = getRiverCount();

    return (
        <>
            {recordings.length > 0 && (
                <div
                    id="share-river"
                    className="ShareRiver relative bg-primary w-full flex flex-col text-black py-24 my-0 mx-auto z-10"
                >
                    <img
                        className="w-[345px] mb-5 mx-auto"
                        src={config.riverTitle}
                        alt="river_title"
                    />
                    <p className="block text-base font-light text-white md:w-[70%] md:m-auto">
                        快來聽聽別人說什麼～點選河道中的錄音檔，即可收聽喔！
                    </p>
                    <div className="h-[336px] mt-12 pt-4 pb-14 overflow-hidden w-full">
                        {rivers &&
                            rivers.map((river, k) => (
                                <>
                                    {true && (
                                        <Marquee.default
                                            className="flex flex-row"
                                            speed={config.riverSpeed[k]}
                                            pauseOnHover
                                            autoFill={recordings.length > 10}
                                        >
                                            <div className="river-wrapper flex whitespace-nowrap mb-10">
                                                {river &&
                                                    river.map((sound, key) => (
                                                        <label
                                                            key={k + key}
                                                            className={`w-[290px] cursor-pointer inline-flex flex-row justify-center pl-20`}
                                                            onClick={() =>
                                                                handleOnClick(
                                                                    sound.recording,
                                                                    sound.id
                                                                )
                                                            }
                                                        >
                                                            <div className="min-w-[92px] h-[92px]">
                                                                <div
                                                                    className="rounded-full responsive-image bg-pink"
                                                                    style={{
                                                                        "--h": 1,
                                                                        "--w": 1,
                                                                    }}
                                                                >
                                                                    <img
                                                                        src={
                                                                            sound.photo
                                                                        }
                                                                        alt=""
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col text-left ml-4 text-white">
                                                                <div className="w-[32px] h-[32px]">
                                                                    {soundId !==
                                                                        sound.id && (
                                                                        <img
                                                                            className="w-full mb-2"
                                                                            src={
                                                                                config.riverSoundBlue
                                                                            }
                                                                        />
                                                                    )}
                                                                    {soundId ===
                                                                        sound.id && (
                                                                        <img
                                                                            className="w-full mb-2"
                                                                            src={
                                                                                config.soundGif
                                                                            }
                                                                            alt="sound-play"
                                                                        />
                                                                    )}
                                                                </div>
                                                                <span className="text-[14px] mb-1 font-bold">
                                                                    {
                                                                        sound.producer
                                                                    }
                                                                </span>
                                                                <span className="text-[14px]">
                                                                    {
                                                                        sound.title
                                                                    }
                                                                </span>
                                                            </div>
                                                        </label>
                                                    ))}
                                            </div>
                                        </Marquee.default>
                                    )}
                                </>
                            ))}
                    </div>
                    <a
                        href={config.riverHost}
                        target="_blank"
                        className="w-[265px] h-[60px] flex items-center justify-center bg-white text-primary mx-auto mt-1 font-medium"
                    >
                        更多真心話
                    </a>
                </div>
            )}
        </>
    );
};

const ReelsVideo = () => {
    const [storage, { posts }] = useContext(StorageContext);
    const config = storage.config;
    const reels = (posts && posts.IG_REELS) || null;
    console.log("reels", reels);

    const renameCopyBtn = (k) => `reel-block-${k}`;

    const handleCopyUrl = (link, key) => {
        const target = document.getElementById(renameCopyBtn(key));

        const isCopyMode = target.classList.contains("copy");
        if (target && !isCopyMode) {
            target.classList.add("copy");
            target.innerText = "已複製網址";

            setTimeout(() => {
                target.classList.remove("copy");
                target.innerText = "點選複製分享連結";
            }, 4000);
        }
        copyToClipboard(link);
    };

    return (
        <div
            id="ad-video"
            className="ReelsVideo relative flex flex-row py-8 text-black bg-pink w-full lg:flex-col overflow-hidden"
        >
            <div className="relative flex-1 flex flex-col items-center justify-center xs:items-start pr-12">
                <div className="text-left text-primary ml-[120px] lg:ml-0">
                    <div className="">
                        <img
                            className="absolute left-0 top-[68px] w-[138px] lg:hidden"
                            src={config.reelBg1}
                            alt="reelBg1"
                        />
                        <img
                            className="absolute -right-[20px] top-[338px] w-[138px] lg:top-[178px]"
                            src={config.reelBg2}
                            alt="reelBg2"
                        />
                        <img
                            className="absolute left-0 bottom-[5px] w-[180px] lg:top-2"
                            src={config.reelBg3}
                            alt="reelBg3"
                        />
                    </div>
                    <div className="relative  ss:mt-24">
                        <img
                            className="w-[159px]"
                            src={config.reelGirl}
                            alt="girl"
                        />
                        <img
                            className="absolute left-[150px] top-0 w-[52px]"
                            src={config.reelStar}
                            alt="reelStar"
                        />
                        <img
                            className="absolute left-[100px] bottom-[6px] w-[74px]"
                            src={config.reelMessage}
                            alt="reelMessage"
                        />
                    </div>
                    <b className="block text-3xl mt-5 xs:ml-14">
                        不敢說？！
                        <br />
                        我們來幫你說！
                    </b>
                    <p className="mt-6 text-base font-light leading-8 tracking-[0.5px] xs:ml-14">
                        有話不敢講？有苦不敢言！
                        <br />
                        不要怕，這次我們幫你說出來
                        <br />
                        點選即可收聽音檔，將滿滿情緒傳給他～
                    </p>
                </div>
            </div>
            <div className="ReelBlock w-[820px] flex flex-row space-x-8 overflow-x-scroll pr-10 z-10 bg-pink lg:w-full lg:mt-9 lg:pl-10">
                {reels &&
                    reels.map((reel, k) => (
                        <section key={k} className="reels-items">
                            <div className="w-[360px] h-[600px] overflow-hidden">
                                <iframe
                                    className="border-0"
                                    scrolling="no"
                                    width="320"
                                    height="460"
                                    src={reel.video_url + "embed"}
                                ></iframe>
                            </div>
                            <button
                                id={renameCopyBtn(k)}
                                onClick={() => handleCopyUrl(reel.link, k)}
                                className="flex justify-center items-center w-[232px] h-[60px] m-auto mt-5 mb-4 bg-primary text-white font-medium"
                            >
                                點選複製分享連結
                            </button>
                        </section>
                    ))}
            </div>
        </div>
    );
};

const Article = () => {
    const [storage] = useContext(StorageContext);
    const [articles, setArticles] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetchGetApi({
                url: storage.config.apiGirlArticleHost,
            });
            console.log("res", res);
            if (res.code === 200) setArticles(res.data.articles);
        } catch (e) {
            console.log("Cannot get article data");
        }
    };
    return (
        <div id="article" className="block-py md:pb-14">
            <b className="block-title pb-12 text-primary">精選文章</b>
            <div className="flex justify-center space-x-10 max-screen center mb-12 md:space-y-10 md:flex-col md:space-x-0">
                {articles &&
                    articles.map((article, k) => (
                        <a
                            href={article.link}
                            key={k}
                            className="w-1/3 text-left md:w-full md:px-10"
                        >
                            <div
                                className="responsive-image rounded-xl overflow-hidden"
                                style={{ "--h": 158, "--w": 315 }}
                            >
                                <img src={article.image} alt="" />
                            </div>
                            <span className="text-[14px] block mt-5 mb-2 text-primary">
                                {article.categoryName}
                            </span>
                            <p
                                className="font-medium text-xl text-black text-more"
                                style={{ "--line": 2 }}
                            >
                                {article.title}
                            </p>
                        </a>
                    ))}
            </div>
            <a
                href={storage.block.article.more}
                target="_blank"
                className="w-[265px] h-[60px] flex justify-center items-center m-auto primary-button bg-primary font-medium"
            >
                more
            </a>
        </div>
    );
};

const Ig = () => {
    const [storage, { posts }] = useContext(StorageContext);
    const data = (posts && posts.IG_POST) || null;

    return (
        <div
            id="ig"
            className="block-py bg-pink rounded-t-[100px] md:pt-[76px]"
        >
            <b className="block-title pb-12 text-primary">＃涼夏圖鑑</b>
            <div className="grid grid-cols-3 gap-8 max-screen center mb-12 md:grid-flow-col md:auto-cols-314 md:grid-cols-314 md:overflow-x-auto md:px-10">
                {data &&
                    data.map((ig, k) => (
                        <a
                            key={k}
                            href={ig.link}
                            target="_blank"
                            className="cursor-pointer responsive-image bg-white"
                            style={{ "--h": 314, "--w": 314 }}
                        >
                            <img src={ig.image_url} alt={`ig-post-` + k} />
                        </a>
                    ))}
            </div>
            <a
                href={storage.block.ig.more}
                target="_blank"
                className="w-[265px] h-[60px] flex justify-center items-center m-auto primary-button bg-primary font-medium"
            >
                more
            </a>
        </div>
    );
};

const YoutubePlayer = () => {
    const [_, { posts }] = useContext(StorageContext);
    const yt = (posts && posts.YT && posts.YT[0]) || null;

    const handleOnPlay = (id) => {
        console.log("ga: click yt id: ", id);
    };

    return (
        <>
            {yt && (
                <div
                    id="youtube"
                    className="YoutubePlayer block-py flex flex-row max-screen m-auto md:flex-col md:px-12"
                >
                    <div className="flex-1 text-left flex flex-col justify-center">
                        <b className="block-title mb-6 w-[370px] text-left text-primary md:w-full">
                            {yt.title}
                        </b>
                        <p className="block text-base max-w-[370px] text-left leading-8 tracking-[0.5px] md:max-w-full">
                            {yt.content}
                        </p>
                    </div>
                    <div className="player w-[670px] h-[390px] md:mt-10 md:w-full">
                        <YouTube
                            iframeClassName="w-full h-full"
                            videoId={yt.id}
                            id="id"
                            onPlay={() => handleOnPlay(yt.id)}
                        ></YouTube>
                    </div>
                </div>
            )}
        </>
    );
};

const Special = () => {
    const [storage] = useContext(StorageContext);
    const config = storage.config;
    const reels = storage.block.special;

    return (
        <div
            id="special"
            className="Special relative flex flex-col items-center py-20 text-black bg-white w-full lg:flex-col overflow-hidden"
        >
            <div className="relative max-screen flex-1 flex flex-col items-center justify-center xs:items-start mr-12 lg:mr-0 lg:p-12">
                <div className="flex flex-row text-left text-blacklight gap-[2.75rem] ml-[120px] lg:ml-0 lg:flex-col lg:items-center">
                    <div className="flex flex-col items-center justify-center w-6/12 lg:w-full">
                        <div className="flex flex-row items-center">
                            <img
                                className="w-[182px] md:w-[140px]"
                                src={config.specialTitle}
                                alt="special-title"
                            />
                            <img
                                className="w-[198px] md:w-[150px]"
                                src={config.specialStrawberry}
                                alt="special-strawberry"
                            />
                        </div>
                        <p className="block text-2xl font-bold leading-8 mt-9">
                            浴衣，燈籠牆、攤販美食的夏日祭典
                            <br />
                            就在榕錦時光生活園區
                            <br />
                            這個夏天兩大好禮要送你！
                        </p>
                    </div>
                    <div className="flex flex-col gap-8 lg:mt-6 w-6/12 lg:w-full">
                        <p className="block text-base font-light leading-8">
                            <b className="font-medium text-primary">好禮一：</b>
                            <br />
                            即日起至 2023/8/31 到榕錦時光生活園區完成與
                            GIRLSTALK 推薦的五大指定打卡點合照並上傳個人 IG
                            限動，即有機會獲得涼夏好禮！
                            （包含老優雅餐廳現金券/花筏亭和服體驗券/京町山本屋茶懷石料理晚餐套餐/興波咖啡超級棧創意特調咖啡/臺虎居酒屋生啤兌換券）
                        </p>
                        <p className="block text-base font-light leading-8">
                            <b className="font-medium text-primary">好禮二：</b>
                            <br />
                            7/22-23、7/29-30 早上11:00-20:00
                            於榕錦時光園區店家消費滿 $600
                            憑當日園區店家消費明細，可至遊客中心可獲得一次抽獎機會。
                            <br />
                            獎品包含：拍貼券一張(限量 100
                            份)與榕錦時光周邊小物-祈福繪馬(限量 200 名)
                            <br />
                            期間限定的夏日祭典拍貼框，讓你不用出國一秒飛日本！跟我們一樣懶得飛日本～這個夏天就到榕錦時光園區一起拍美照感受濃濃日本氣氛
                        </p>

                        <p className="block text-base font-light leading-8">
                            <b className="font-medium text-primary">
                                榕錦生活時光園區
                            </b>
                            <br />
                            台北市大安區金華街167號（捷運東門站3號出口）
                            <br />
                            活動期間：即日起至2023/8/31
                        </p>
                    </div>
                </div>
            </div>
            {/* <div className="ReelBlock max-screen m-auto flex flex-row justify-between space-x-8 overflow-x-scroll  pr-0 mt-9 z-10 bg-white lg:w-full lg:pl-10 lg:pr-10">
                 {reels &&
                     reels.map((reel, k) => (
                         <section key={k} className="reels-items w-[360px]">
                             <div className="w-[360px] h-[600px] overflow-hidden">
                                 <iframe
                                     className="border-0"
                                     scrolling="no"
                                     width="320"
                                     height="460"
                                     src={reel.url + "embed"}
                                 ></iframe>
                             </div>
                             <div
                                 className="text-xl font-semibold mt-4 text-left text-more leading-8"
                                 style={{ "--line": 2 }}
                             >
                                 {reel.title}
                             </div>
                         </section>
                     ))}
             </div>  */}
        </div>
    );
};

const Brand = () => {
    const [storage] = useContext(StorageContext);
    const brands = storage.block.brand;

    return (
        <div id="brand" className="space-y-10 bg-primary py-9 pb-20">
            {brands &&
                brands.map((brand, key) => (
                    <section key={key}>
                        <span className="block mb-8 text-white md:text-[14px]">
                            {brand.name}
                        </span>
                        <div className="use-parent-h flex justify-center space-x-7 md:flex-col md:items-center md:space-x-0 md:space-y-14">
                            {brand.logos &&
                                brand.logos.map((logo, key) => (
                                    <label
                                        key={key}
                                        className="h-[84px] md:h-[52px]"
                                    >
                                        <img src={logo}></img>
                                    </label>
                                ))}
                        </div>
                    </section>
                ))}
        </div>
    );
};

const Footer = () => {
    const [storage] = useContext(StorageContext);
    const footerIcons = storage.footer;
    const brands = storage.block.brand;

    return (
        <footer className="w-full bg-black text-white md:mb-[68px] py-7">
            <div className="max-screen flex flex-row justify-between items-center center md:flex-col-reverse md:justify-center">
                <div className="font-light md:mt-3">
                    <img
                        className="mb-6 md:hidden"
                        src={brands[0].logos}
                        alt=""
                    />
                    2023 GIRLSTALK © All Rights Reserved.
                </div>
                <div className="space-x-10 flex flex-row items-center">
                    <span>追蹤最新消息</span>
                    {footerIcons &&
                        footerIcons.map((icon, key) => (
                            <a key={key} href={icon.link} target="_blank">
                                <img
                                    className="h-16 md:h-10"
                                    src={icon.icon}
                                    alt="icon"
                                />
                            </a>
                        ))}
                </div>
            </div>
        </footer>
    );
};

const MobileNavFooter = () => {
    const [storage] = useContext(StorageContext);
    const config = storage.config;

    return (
        <div className="hidden text-white text-base font-medium fixed py-5  px-5 bottom-0 left-0 w-full md:flex flex-row justify-center items-center bg-primary h-[68px] z-20">
            <div className="flex-1 flex justify-center mr-2 gap-2">
                <a className="w-1/2" href="#">
                    涼夏圖鑑
                </a>
                <i className="border-left border-white border h-[24px]"></i>
                <a className="w-1/2" href="#share-river">
                    告白河道
                </a>
            </div>
            <a
                className="h-[36px] w-[154px] bg-white text-primary rounded-3xl flex justify-center items-center"
                href={config.giftHost}
                target="_blank"
            >
                驚喜好禮
            </a>
        </div>
    );
};
/* ===============================================================================
 * Component order
 * ================================================================================
 */

const BLOCK_ORDER = [
    <MainEntryRoute />,
    <ShareRiver />,
    <ReelsVideo />,
    <Article />,
    <Ig />,
    <Special />,
];

/* ===============================================================================
 * App entrypoint
 * ================================================================================
 */

const App = () => {
    const [storage, { isMobile }, resetDynamicData] =
        useContext(StorageContext);
    const config = storage.config;

    useEffect(() => {
        getPosts();
        resetDynamicData("isMobile", checkIsMobile(window.innerWidth));

        window.addEventListener("resize", function (event) {
            resetDynamicData(
                "isMobile",
                checkIsMobile(document.body.clientWidth)
            );
        });
    }, []);

    const getPosts = async () => {
        const data = await fetchGetApi({ url: apiHost + "/get-posts" });
        if (data && data.code === 200) resetDynamicData("posts", data.data);
    };

    return (
        <div className="flex flex-col w-full">
            <NavigationBar className="space-y-20" />
            <main className="flex flex-col items-center">
                {BLOCK_ORDER &&
                    BLOCK_ORDER.map((block, k) => (
                        <section key={k} className="w-full text-center">
                            {block}
                        </section>
                    ))}
            </main>
            {isMobile && <MobileNavFooter />}
            <Footer />
        </div>
    );
};
export default App;

ReactDOM.render(
    <StorageProvider>
        <App />
    </StorageProvider>,
    document.querySelector("#root")
);
