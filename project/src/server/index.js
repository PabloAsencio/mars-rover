require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, '../public')));

// your API calls
app.get('/rover/:roverName', async (req, res) => {
    try {
        fetch(
            `https://api.nasa.gov/mars-photos/api/v1/rovers/${req.params.roverName}/latest_photos?api_key=${process.env.API_KEY}`
        )
            .then((response) => response.json())
            .then((data) => res.send(data));
    } catch (error) {
        console.error(error.message);
    }
});

const makePhotoObject = (photo) => {
    const { camera, img_src, rover, earth_date } = photo;
    return {
        img_src,
        earth_date,
        camera: camera.full_name,
        rover: rover.name,
    };
};

const getLastThreePictures = async (rover, max_sol) => {
    const result = [];
    try {
        const response = await fetch(
            `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/latest_photos?api_key=${process.env.API_KEY}`
        );
        const responseJSON = await response.json();
        const latestPhotos = responseJSON.latest_photos.map(makePhotoObject);
        const missingPhotos =
            3 -
            result.push(...latestPhotos.filter((current, index) => index < 3));
        if (missingPhotos > 0) {
            const secondResponse = await fetch(
                `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?sol=${
                    max_sol - 1
                }&api_key=${process.env.API_KEY}`
            );
            const secondResponseJSON = await secondResponse.json();
            const additionalPhotos = secondResponseJSON.photos.map(
                makePhotoObject
            );
            result.push(
                additionalPhotos.filter(
                    (current, index) => index < missingPhotos
                )
            );
        }
    } catch (error) {
        console.log(error);
        throw new Error(error.message);
    }
    return result;
};

app.get('/manifests/:roverName', async (req, res) => {
    try {
        fetch(
            `https://api.nasa.gov/mars-photos/api/v1/manifests/${req.params.roverName}?api_key=${process.env.API_KEY}`
        )
            .then((response) => response.json())
            .then(async (roverInfo) => {
                const {
                    name,
                    launch_date,
                    landing_date,
                    status,
                    max_date,
                    max_sol,
                } = roverInfo.photo_manifest;
                const photos = await getLastThreePictures(name, max_sol);
                return {
                    name,
                    launch_date,
                    landing_date,
                    status,
                    max_date,
                    photos,
                };
            })
            .then((data) => res.send(data));
    } catch (error) {
        console.error(error.message);
    }
});

app.listen(port, () => console.log(`Mars rovers app listening on port ${port}!`));
