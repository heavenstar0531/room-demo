import Canvas from "components/canvas";
import PromptForm from "components/prompt-form";
import Head from "next/head";
import { useState } from "react";
import Predictions from "components/predictions";
import Error from "components/error";
import uploadFile from "lib/upload";
import Script from "next/script";
import seeds from "lib/seeds";
import pkg from "../package.json";
import sleep from "lib/sleep";
import axios from "axios";
import { Spin, Select } from 'antd';
import { AlignHorizontalDistributeCenter } from "lucide-react";
import { PacmanLoader } from "react-spinners";

const HOST = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export default function Home() {
  const [error, setError] = useState(null);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [predictions, setPredictions] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [scribbleExists, setScribbleExists] = useState(false);
  const [seed] = useState(seeds[Math.floor(Math.random() * seeds.length)]);
  const [initialPrompt] = useState(seed.prompt);
  const [scribble, setScribble] = useState(null);
  const [uploadIMG, setUploadimg] = useState()
  const [image, setImage] = useState(null)
  const [baseImage, setBaseImage] = useState(null)
  const [outImage, setOutImage] = useState(null)
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('modern, living room')

  const handleSubmit = async (e) => {
    e.preventDefault();

    // track submissions so we can show a spinner while waiting for the next prediction to be created
    setSubmissionCount(submissionCount + 1);

    const prompt = e.target.prompt.value;

    setError(null);
    setIsProcessing(true);

    const fileUrl = await uploadFile(scribble);
    console.log("ssssssssss", fileUrl)

    const body = {
      prompt,
      image: fileUrl,
    };

    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    let prediction = await response.json();

    setPredictions((predictions) => ({
      ...predictions,
      [prediction.id]: prediction,
    }));

    if (response.status !== 201) {
      setError(prediction.detail);
      return;
    }

    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await sleep(500);
      const responses = await fetch("/api/predictions/" + prediction.id);
      prediction = await responses.json();

      setPredictions((predictions) => ({
        ...predictions,
        [prediction.id]: prediction,
      }));
      if (responses.status !== 200) {
        setError(prediction.detail);
        return;
      }
    }

    setIsProcessing(false);
  };

  const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);

      fileReader.onload = () => {
        resolve(fileReader.result);
      };

      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const onImageChange = async (event) => {
    if (event.target.files && event.target.files[0]) {
      setImage(URL.createObjectURL(event.target.files[0]));
      const file = event.target.files[0];
      const base64 = await convertBase64(file)
      setBaseImage(base64)
    }
  }

  const imageGenerate = async () => {
    setLoading(true)
    const body = {
      imgFile: baseImage,
      prompt: prompt
    }
    const uploadResult = await axios.post("https://246kz3vgc2.execute-api.eu-west-1.amazonaws.com/development/api/upload-image", body)

    const generateBody = {
      image: uploadResult.data.location,
      prompt: prompt
    }

    const imageID = await axios.post("https://246kz3vgc2.execute-api.eu-west-1.amazonaws.com/development/api/home", generateBody)
    console.log(imageID)
    let prediction = {
      status: "start"
    }
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await sleep(500);
      const imageResult = await axios.get("https://246kz3vgc2.execute-api.eu-west-1.amazonaws.com/development/api/home/" + imageID.data)
      prediction = imageResult.data
      console.log(imageResult)
    }
    setLoading(false)
    setOutImage(prediction.output)
  }

  const handleChange = (value) => {
    setPrompt(value)
  };

  return (
    <div>
      <Head>
        <meta name="description" content={pkg.appMetaDescription} />
        <meta property="og:title" content={pkg.appName} />
        <meta property="og:description" content={pkg.appMetaDescription} />
        <meta
          property="og:image"
          content={`${HOST}/og-b7xwc4g4wrdrtneilxnbngzvti.png`}
        />
        <title>{pkg.appName}</title>s
      </Head>
      <main className="container max-w-[1024px] mx-auto p-5 ">
        <div className="container max-w-[1024px] mx-auto">
          <hgroup>
            <h1 className="text-center text-5xl font-bold m-4">
              Room GPT for Yafei and Trac
            </h1>
          </hgroup>

          <div>
            <div className="flex flex-row gap-2">
              <input
                id="selectAvatar"
                type="file"
                onChange={(e) => onImageChange(e)}
              />
              <Select
              className="w-[200px]"
              size="large"
                onChange={handleChange}
                options={[
                  {
                    value: 'modern, living room',
                    label: 'modern, living room',
                  },
                  {
                    value: 'modern, bed room',
                    label: 'modern, bed room',
                  },
                ]}
              />
            </div>
            <div className="flex flex-row gap-1 mt-5">
              <img className="w-2/4" src={image} />
              <div className="w-2/4">
                <Spin spinning={loading}>
                  <img className="w-full h-[400px]" src={outImage} />
                </Spin>
              </div>
            </div>
          </div>

          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full mt-5" onClick={imageGenerate}>
            Generate
          </button>

          <Error error={error} />
        </div>
      </main>

      <Script src="https://js.upload.io/upload-js-full/v1" />
    </div>
  );
}
