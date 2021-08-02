let store = Immutable.Map({
    rovers: Immutable.Map({
        Curiosity: Immutable.Map({ name: 'Curiosity' }),
        Opportunity: Immutable.Map({ name: 'Opportunity' }),
        Perseverance: Immutable.Map({ name: 'Perseverance' }),
        Spirit: Immutable.Map({ name: 'Spirit' }),
    }),
    active: 'Curiosity',
});

// add our markup to the page
const root = document.getElementById('root');

const updateStore = (newState) => {
    store = store.merge(newState);
    render(root, store);
};

const render = async (root, state) => {
    root.innerHTML = App(state);
};

const formatDate = (stringDate) => {
    return new Date(Date.parse(stringDate)).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const createAltText = (photo) => {
    return `${photo.rover} Rover, ${formatDate(photo.earth_date)}, ${
        photo.camera
    }`;
};

const createCaption = (photo) => {
    return `<span class="slideshow__caption--name">${
        photo.rover
    } Rover,</span> <span class="slideshow__caption--date">${formatDate(
        photo.earth_date
    )},</span> <span class="slideshow__caption--camera">${photo.camera}</span>`;
};

const getNewIndex = (computedIndex, maxIndex) => {
    return (computedIndex + maxIndex) % maxIndex;
};

const showSlide = (rover, index) => {
    document
        .querySelectorAll(`[data-rover="${rover}"]`)
        .forEach((photo) => photo.classList.remove('active'));
    document
        .querySelector(`[data-rover="${rover}"][data-index="${index}"]`)
        .classList.add('active');
};

const checkImageSize = (src) => {
    const img = document.querySelector(`[src="${src}"]`);
    if (img.naturalWidth < 100) {
        img.classList.add('image--small');
    }
};

const createSlideshowItem = (photo, index, array) => {
    return `
        <div class="slideshow__photo${
            index == 0 ? ' active' : ''
        }" data-rover="${photo.rover}" data-index="${index}">
            <figure>
                <img src="${photo.img_src}" onLoad="checkImageSize('${
        photo.img_src
    }')" alt="${createAltText(photo)}">
                <figcaption><span class="slideshow__number">(${index + 1} / ${
        array.length
    })</span> <span class="slideshow__caption">${createCaption(
        photo
    )}</span></figcaption>
            </figure>
            <a class="slideshow__arrow slideshow__arrow--previous" onClick="showSlide('${
                photo.rover
            }', ${getNewIndex(index - 1, array.length)})">&#10094;</a>
            <a class="slideshow__arrow slideshow__arrow--next" onClick="showSlide('${
                photo.rover
            }', ${getNewIndex(index + 1, array.length)})">&#10095;</a>
        </div>
    `;
};

const createSlideshow = (rover) => {
    return `
    <div class="slideshow">
        ${rover.get('photos').map(createSlideshowItem).join('\n')}
    </div>
    `;
};

const createRoverCard = (rover) => {
    return `
    <div class="slideshow__info">
        <p><span class="slideshow__label">Launch date:</span> <span class="slideshow__date">${formatDate(
            rover.get('launch_date')
        )}</span></p>
        <p><span class="slideshow__label">Landing date:</span> <span class="slideshow__date">${formatDate(
            rover.get('landing_date')
        )}</span></p>
        <p><span class="slideshow__label">Most recent activity:</span> <span class="slideshow__date">${formatDate(
            rover.get('max_date')
        )}</span></p>
        <p><span class="slideshow__label">Status:</span> <span class="slideshow__date">${rover.get(
            'status'
        )}</span></p>
    </div>
    ${createSlideshow(rover)}`;
};

const createRoverSectionContent = (rover) => {
    if (!rover.get('error') && !rover.get('photos')) {
        return `<p class="loadingMessage">Loading data...</p>`;
    } else if (rover.get('error')) {
        return `<p class="errorMessage">${rover.get('error')}</p>`;
    } else {
        return createRoverCard(rover);
    }
};

const createRoverSection = (rover) => {
    return `<section ${
        store.get('active') === rover.get('name') ? 'class="active"' : ''
    }>
        <h2>${rover.get('name')}</h2>
        ${createRoverSectionContent(rover)}
    </section>`;
};

const showRover = (rover) => {
    const newState = Immutable.Map({ active: rover });
    const rovers = store.get('rovers');
    if (!rovers.get(rover).get('photos')) {
        fetch('http://localhost:3000/manifests/' + rover)
            .then((response) => response.json())
            .then((roverData) => {
                updateStore(
                    Immutable.Map({
                        rovers: rovers.set(rover, Immutable.Map(roverData)),
                    })
                );
            })
            .catch((error) => {
                updateStore(
                    Immutable.Map({
                        rovers: rovers.set(
                            rover,
                            Immutable.Map({
                                name: rover,
                                error: 'Something went wrong. Try again later.',
                            })
                        ),
                    })
                );
            });
    }
    updateStore(newState);
};

const createRoverButton = (rover) => {
    return `<button onClick="showRover('${rover.get('name')}')" ${
        store.get('active') == rover.get('name') ? 'disabled' : ''
    }>${rover.get('name')}</button>`;
};

// create content
const App = (state) => {
    let rovers = state.get('rovers');

    return `
        <header>
            <h1>Mars Rovers</h1>
        </header>
        <main>
            <div class="button-area">${rovers.map(createRoverButton).join('\n')}
            </div>
            ${rovers.map(createRoverSection).join('\n')}
        </main>
        <footer>
            <h2>Mars Rovers</h2>
            <p><small>Powered by <a href="https://api.nasa.gov/">NASA APIs.</a></small></p>
            <p><small>&copy; Pablo Asencio Sánchez, 2021</small></p>
        </footer>
    `;
};

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    showRover(store.get('active'));
});
