"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class Workouts {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  click = 0;
  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance; //in km
    this.duration = duration; //in min
  }

  click() {
    this.click++;
  }
  _setDiscription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.discription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workouts {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.clacPace();
    this._setDiscription();
  }

  clacPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workouts {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.clacSpeed();
    this._setDiscription();
  }

  clacSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

///////////////////////////////////////////////////////////////////////////
//APPLICATION ARCHITECTURE

class App {
  #map;
  #mapEvent;
  #workOut = [];
  #mapZoomLevel = 15;
  constructor() {
    // get user position
    this._getPosition();

    // get the data from localstorage
    this._getLocalStorage();

    // add event handeler
    form.addEventListener("submit", this._newWorkOut.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),

        function () {
          alert("not get your position");
        }
      );
    }
  }

  _loadMap(position) {
    //   console.log(position);
    const { latitude, longitude } = position.coords;
    //   const { longitude } = position.coords;
    console.log(latitude, longitude);
    //   console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const cords = [latitude, longitude];

    this.#map = L.map("map").setView(cords, this.#mapZoomLevel);
    console.log(this.#map);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //   Handlling click on this.#map
    this.#map.on("click", this._showFrom.bind(this));

    this.#workOut.forEach((work) => {
      this._renderWorkOutMarker(work);
    });
  }

  _showFrom(mapE) {
    this.#mapEvent = mapE;

    form.classList.remove("hidden");

    inputDistance.focus();
  }

  _hideFrom() {
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        "";

    form.style.display = "none";

    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _toggleElevationField(e) {
    e.preventDefault();

    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkOut(e) {
    // valiadition check
    const validInput = (...input) => input.every((inp) => Number.isFinite(inp));
    const allPositive = (...input) => input.every((inp) => inp > 0);

    e.preventDefault();

    // 1 Take input from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // if Workout is running store cadence create running object

    if (type === "running") {
      const cadence = +inputCadence.value;
      // check if data was valid or not

      //  gurd cluse
      if (
        !validInput(duration, distance, cadence) ||
        !allPositive(duration, distance, cadence)
      )
        return alert(` Input  Has To A Positive Number`);

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // if workout is cylcling then store elivationgain and create cycling object

    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !validInput(duration, distance, elevation) ||
        !allPositive(duration, distance)
      )
        return alert(` Input  Has To A Positive Number`);

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    this.#workOut.push(workout);
    console.log(workout);

    // render the workout
    this._renderWorkOutMarker(workout);

    // render workout lis
    this._renderWorkList(workout);

    // hide from + clear input fields

    this._hideFrom();

    // set to local storage

    this._setLOcalStorage();
  }
  _renderWorkOutMarker(workout) {
    console.log(workout.coords);
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀"}${workout.discription} `
      )
      .openPopup();
  }

  _renderWorkList(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.discription}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === "running" ? "🏃‍♂️" : "🚴‍♀"
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === "running") {
      html += ` 
       <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
      `;
    }

    if (workout.type === "cycling") {
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>`;
    }

    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(e) {
    if (!this.#map) return;

    const workoutEl = e.target.closest(".workout");
    console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.#workOut.find(
      (work) => work.id === workoutEl.dataset.id
    );
    console.log(workout);
    this.#map.setView(workout.coords, 15, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLOcalStorage() {
    localStorage.setItem("workout", JSON.stringify(this.#workOut));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workout"));
    console.log(data);
    if (!data) return;

    this.#workOut = data;

    this.#workOut.forEach((work) => this._renderWorkList(work));
  }
  reset() {
    localStorage.removeItem("workout");
    localStorage.reload();
  }
}

const app = new App();
console.log(app);
