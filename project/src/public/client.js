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

const createCaption = (photo) => {
    return `${photo.rover} &mdash; ${photo.camera} &mdash; ${formatDate(
        photo.earth_date
    )}`;
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

const createSlideshowItem = (photo, index, array) => {
    return `
        <div class="slideshow__photo${
            index == 0 ? ' active' : ''
        }" data-rover="${photo.rover}" data-index="${index}">
            <figure>
                <img src="${photo.img_src}" alt="${createCaption(photo)}">
                <figcaption>${index + 1} / ${
        array.length
    } &ndash; ${createCaption(photo)}</figcaption>
            </figure>
            <a class="slideshow__arrow--previous" onClick="showSlide('${
                photo.rover
            }', ${getNewIndex(index - 1, array.length)})">&#10094;</a>
            <a class="slideshow__arrow--next" onClick="showSlide('${
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
    <p>Launch date: ${rover.get('launch_date')}</p>
    <p>Landing date: ${rover.get('landing_date')}</p>
    <p>Most recent active date: ${rover.get('max_date')}</p>
    <p>Status: ${rover.get('status')}</p>
    ${createSlideshow(rover)}`;
};

const createRoverSectionContent = (rover) => {
    if (!rover.get('error') && !rover.get('photos')) {
        return `<p>Loading data...</p>`;
    } else if (rover.get('error')) {
        return `<p>${rover.get('error')}</p>`;
    } else {
        return createRoverCard(rover);
    }
};

const createRoverSection = (rover) => {
    return `<section ${
        store.get('active') === rover.get('name') ? 'class="active"' : ''
    }>
        <h3>${rover.get('name')}</h3>
        ${createRoverSectionContent(rover)}
    </section>`;
};

const fetchPhotos = (rover) => {};

const showRover = (rover) => {
    const newState = Immutable.Map({ active: rover });
    const rovers = store.get('rovers');
    if (!rovers.get(rover).get('photos')) {
        fetch('http://localhost:3000/manifests/' + rover)
            .then((response) => response.json())
            .then((roverData) => {
                updateStore(
                    newState.set(
                        'rovers',
                        rovers.set(rover, Immutable.Map(roverData))
                    )
                );
            })
            .catch((error) => {
                updateStore(
                    newState.set(
                        'rovers',
                        rovers.set(
                            rover,
                            Immutable.Map({
                                name: rover,
                                error: 'Something went wrong. Try again later.',
                            })
                        )
                    )
                );
            });
    }
    updateStore(newState);
};

const createRoverButton = (rover) => {
    return `<button onClick="showRover('${rover.get('name')}')">${rover.get(
        'name'
    )}</button>`;
};

// create content
const App = (state) => {
    let rovers = state.get('rovers');

    return `
        <header></header>
        <main>
            ${rovers.map(createRoverButton).join('\n')}
            ${rovers.map(createRoverSection).join('\n')}
        </main>
        <footer></footer>
    `;
};

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    showRover(store.get('active'));
});
