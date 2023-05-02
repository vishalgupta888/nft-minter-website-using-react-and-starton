const express = require('express')
const FormData = require('form-data')
const Blob = require('blob');
const cors = require('cors')
const multer = require('multer')
const axios = require('axios')
const app = express()
const port = process.env.PORT || 5000

pp.use(express.json())

const upload = multer({
    limits:{
        fileSize:1000000
    }
})

const starton = axios.create({
    baseURL: "https://api.starton.io/v3",
    headers: {
        "x-api-key": "sk_live_a76e1af6-0635-4755-bef6-9a82a9623f22",
    },
  })

  app.post('/upload',cors(),upload.single('file'),async(req,res)=>{
   
    let data = new FormData();
    const blob = new Blob([req.file.buffer],{type:req.file.mimetype});
    data.append("file",blob,{filename:req.file.originalnam})
    data.append("isSync","true");

    async function uploadImageOnIpfs(){
        const ipfsImg = await starton.post("/ipfs/file", data, {
            headers: { "Content-Type": `multipart/form-data; boundary=${data._boundary}` },
          })
          return ipfsImg.data;
    }
    async function uploadMetadataOnIpfs(imgCid){
        const metadataJson = {
            name: `A Wonderful NFT`,
            description: `Probably the most awesome NFT ever created !`,
            image: `ipfs://ipfs/${imgCid}`,
        }
        const ipfsMetadata = await starton.post("/ipfs/json", {
            name: "My NFT metadata Json",
            content: metadataJson,
            isSync: true,
        })
        return ipfsMetadata.data;
    }
    
    const SMART_CONTRACT_NETWORK="polygon-mumbai"
    const SMART_CONTRACT_ADDRESS="0x0245C4fA1b848e49e257c49a620B0e05c3F0bDE0"
    const WALLET_IMPORTED_ON_STARTON="0x4936CEeF7bbE025DBc94ECf6AA921C9f2Eb103Da";
    async function mintNFT(receiverAddress,metadataCid){
        const nft = await starton.post(`/smart-contract/${SMART_CONTRACT_NETWORK}/${SMART_CONTRACT_ADDRESS}/call`, {
            functionName: "mint",
            signerWallet: WALLET_IMPORTED_ON_STARTON,
            speed: "low",
            params: [receiverAddress, metadataCid],
        })
        return nft.data;
    }
    const RECEIVER_ADDRESS = "0x4653CeA34af4B3cF4B27C912A5BBEE015b9E7Fb0"
    const ipfsImgData = await uploadImageOnIpfs();
    const ipfsMetadata = await uploadMetadataOnIpfs(ipfsImgData.cid);
    const nft = await mintNFT(RECEIVER_ADDRESS,ipfsMetadata.cid)
    console.log(nft)
    res.status(201).json({
        transactionHash:nft.transactionHash,
        cid:ipfsImgData.cid
    })
  })
  app.listen(port,()=>{
    console.log('Server is running on port '+ port);
  })