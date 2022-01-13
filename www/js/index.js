/**
 * @author Sean Reyboz
 * @description Script principal utilisé dans le projet "Weatherbit". Permet de
 * d'effectuer des requetes ajax sur le script PHP `php/curl.php`, et de mettre
 * à jour le document avec les données retournées.
 * @version 1.0 -- 20 Septembre 2021
 *
 * @todo Créer une version responsive de l'appli.
 */

"use strict"

const body = document.querySelector("body"),
  searchButton = document.querySelector("#search-icon"),
  searchInput = document.querySelector("#search-input"),
  fullScreenSearchBar = document.querySelector(".search-input-container"),
  city = document.querySelector(".forecast-details_location"),
  date = document.querySelector(".forecast-details_date"),
  precip = document.querySelector("#precipitation-height"),
  sunrise = document.querySelector("#sunrise-time"),
  sunset = document.querySelector("#sunset-time"),
  temp = document.querySelector("#temperature"),
  windSpd = document.querySelector("#wind-speed"),
  wthrImg = document.querySelector("#weather-illustration")

/**
 * toggleClass()
 *
 * @param {string} className - La classe à toggle
 * @param {Node} el - L'élément HTML
 */
function toggleClass(className, el) {
  if (el.classList.contains(className)) el.classList.remove(className)
  else el.classList.add(className)
}

// Récupérer les boutons de la liste de prévision
searchButton.addEventListener("click", () => {
  toggleClass("focused", fullScreenSearchBar)
  searchInput.focus()
})

fullScreenSearchBar.addEventListener("click", e => {
  if (e.target.classList.contains("search-input-container"))
    toggleClass("focused", fullScreenSearchBar)
})

const days = document.querySelectorAll("[data-day]")

days.forEach(day => {
  day.addEventListener("click", e => {
    const activeDay = e.target.getAttribute("data-day")
    const index = Number.parseInt(activeDay)

    updateDocumentValues(ajaxResponse[index])
  })
})

// Valeurs des couleurs du gradient d'arrière plan
const hotTempCol = "background-color: #d9547b;",
  avgTempCol = "background-color: #71376e;",
  coldTempCol = "background-color: #1da9c2;"

let ajaxResponse

/** ---------------------
 * 		    Fonctions
 * ---------------------- */

/**
 * Requête AJAX principale.
 *
 * @param {string} location La ville/localisation à utiliser.
 * @param {number} activeDay La valeur du jour actuellement sélectionné dans la
 * liste de navigation (ex: #day-0 => 0, #day-2 => 2, etc )
 */
const ajaxRequest = (location, activeDay) => {
  let query = `&city=${location}`

  $.ajax({
    type: "POST",
    dataType: "json",
    url: "php/curl.php",
    data: "&days=7" + query,
    complete: data => {
      // console.log(data.responseText);

      // Tenter de convertir la réponse au format JSON...
      try {
        ajaxResponse = JSON.parse(data.responseText)
        // console.log(ajaxResponse)
        handleAjaxResponse(ajaxResponse, activeDay)

        // ... et gérer les erreurs liées à une localisation invalide.
      } catch (error) {
        console.error("ERROR:", error)
        alert(data.responseText)
      }
    },
  })
}

/**
 * Modifie la couleur de l'arrière plan en fonction de la température.
 *
 * @param {number} temp Une température.
 */
function setBackgroundColor(temp) {
  // console.log("typeof background value: " + typeof temp);

  if (typeof temp === "number") {
    if (temp > 25) body.setAttribute("style", hotTempCol)
    else if (temp <= 25 && temp >= 10) body.setAttribute("style", avgTempCol)
    else if (temp < 10) body.setAttribute("style", coldTempCol)
  } else {
    body.setAttribute("style", avgTempCol)
  }
}

/**
 * Met à jour l'illustration de la page.
 *
 * @param {number} weatherCode La valeur du "Weather Code", ou code de temps,
 * qui permet de renseigner sur la nature du temps (pluie, neige, nuageux, ...)
 */
function setWeatherIllustration(weatherCode) {
  const path = "url('./assets/img/"
  // console.log('Weather code: ' + weatherCode);

  if (typeof weatherCode !== "number") return

  if (weatherCode <= 202)
    wthrImg.style.backgroundImage = path + "partly_day_storm.png')"

  if (weatherCode >= 230 && weatherCode <= 233)
    wthrImg.style.backgroundImage = path + "thunderstorm.png')"

  if (weatherCode >= 300 && weatherCode <= 522)
    wthrImg.style.backgroundImage = path + "rainy.png')"

  if (weatherCode >= 600 && weatherCode <= 623)
    wthrImg.style.backgroundImage = path + "snowy.png')"

  if (weatherCode == 800)
    wthrImg.style.backgroundImage = path + "slight_touch_happyday.png')"

  if (weatherCode > 800 && weatherCode < 804)
    wthrImg.style.backgroundImage = path + "partly_cloudy.png')"

  if (weatherCode >= 804) wthrImg.style.backgroundImage = path + "cloudy.png')"
}

/**
 * Permet de mettre à jour les valeurs des prévisions (vitesse du vent,
 * température, horaire du lever/coucher du soleil, ...), ainsi que la
 * couleur du gradient d'arrière plan et les illustrations de temps.
 *
 * @param {object} obj L'objet retourné par la requête AJAX, contenant un
 * tableau de prévisions.
 */
function updateDocumentValues(obj) {
  // console.log("obj: " + obj)
  // console.log('obj length: ' + obj.length);

  // S'il s'agit d'un objet et non d'un tableau, récupérer le premier objet.
  if (obj.length !== undefined) obj = obj[0]

  // console.log('obj modif length: ' + obj.length);

  setBackgroundColor(obj.temp)
  setWeatherIllustration(obj.weatherCode)

  city.textContent = obj.city
  date.textContent = obj.date
  windSpd.textContent = obj.wind + " km/h"
  temp.textContent = obj.temp + "°"
  precip.textContent = obj.precip + " mm"
  sunrise.textContent = obj.sunrise
  sunset.textContent = obj.sunset
}

/**
 * Modification de la liste des jours en fonction du jour actuel.
 *
 * @param {object} jsonObj L'objet retourné par la requête AJAX, contenant un
 * tableau de prévisions.
 */
function setDaysList(jsonObj) {
  const len = jsonObj.length

  for (let i = 0; i < len; i++) {
    // console.log(`days[${i}] --- json obj: ${jsonObj[i].actualDay}`);
    days[i].textContent = jsonObj[i].actualDay
  }
}

/**
 * Fonction appelée à chaque nouvelle requête AJAX.
 * Appelle à sont tour les fonctions `SetDaysList()` et `UpdateDocumentValues()`,
 * et met à jour la valeur de la ville recherchée dans le localStorage.
 *
 * @param {object} response L'objet retourné par la requête AJAX.
 * @param {number} activeDay La valeur du jour actuellement sélectionné dans la
 * liste de navigation.
 */
function handleAjaxResponse(response, activeDay) {
  setDaysList(response)
  updateDocumentValues(response[activeDay])
  window.localStorage.setItem("lastSearchedLocation", response[0].city)
}

/** --------------------
 *        JQuery
 * --------------------- */

$(document).ready(() => {
  /** ------------------------------------------------------
   *        Requete AJAX au premier chargement de page
   * ------------------------------------------------------ */

  // Récupérer la valeur du jour actif dans la barre de navigation.
  let activeDay = $("button.active")[0].getAttribute("data-day")

  // Récupérer le nom de la dernière localisation recherchée, si elle existe
  const location =
    window.localStorage.getItem("lastSearchedLocation") || "Paris"

  ajaxRequest(location, activeDay) // Effectuer la requete

  /** ------------------------------------------------------
   *     Requete AJAX après recheche d'une localisation
   * ------------------------------------------------------ */

  // Exécuter la requête AJAX quand le formulaire est envoyé.
  $("#search-form").on("submit", event => {
    const searchedLocation = $("#search-input").val()

    // Récupérer la valeur numérique jour actuellement consulté
    // activeDay = $("button.active")[0].id.split("-")[1]
    activeDay = $("button.active")[0].getAttribute("data-day")

    ajaxRequest(searchedLocation, activeDay)

    // Fermer la barre de recherche
    setTimeout(() => toggleClass("focused", fullScreenSearchBar), 200)

    // Empêcher le rechargement de la page
    event.preventDefault()
  })

  // Mise à jour du jour actif.
  $(".forecast-days-list button").click(function () {
    $(".forecast-days-list .active").removeClass("active")
    $(this).addClass("active")
  })

  // Petite animation sympathique: faire bouger l'illustration en fonction de
  // la position du curseur
  const cursor = { x: 0, y: 0 }

  $(document).mousemove(e => {
    cursor.x = -e.clientX * 0.025
    cursor.y = -e.clientY * 0.025

    wthrImg.style.backgroundPositionX = `calc(50% + ${cursor.x}px)`
    wthrImg.style.backgroundPositionY = `calc(50% +${cursor.y}px)`
  })
})
