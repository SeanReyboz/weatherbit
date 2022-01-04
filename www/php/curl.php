<?php
/**
 * @author Sean Reyboz
 * @version 1.2 -- 04 Janvier 2022
 */

define("BASE_URL", "https://api.weatherbit.io/v2.0/forecast/daily?");
define("API_KEY", "&key=6a95e0586d2d496bbef04ff367a2ed53");

define("DAYS", 7);    // Nombre de jours de prévision


// Vérifier que des données soient présentes dans la requête reçue.
$location = (!empty($_REQUEST) && !empty($_REQUEST['city'])) ? urlencode($_REQUEST['city']) : 'Paris';


// Création de la requête à utiliser pr interroger l'API.
$requete = BASE_URL . "days=" . DAYS . "&city=" . $location . API_KEY;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $requete);
curl_setopt($ch, CURLOPT_HEADER, 0);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$raw_json = curl_exec($ch);

// Si l'objet JSON retourné par l'API n'est pas vide, le décoder pour récupérer
// les informations nécessaires. 
// Dans le cas contraire, afficher un message d'erreur et quitter le script.
if (!empty($raw_json))
	$decoded_json = json_decode($raw_json, true);
else {
	echo "Could not find any location matching \"$location_input\".\nOpen the console for more details.";
	exit(1);
}

curl_close($ch);


/** ---------------------------------
 *      Définition des variables
 * ---------------------------------- */

// Définir une timezone par défaut pour date() et récupérer la date actuelle
date_default_timezone_set('Europe/Paris');
$today = date("j F");

$date = '';
$day = '';
$city = '';
$pod = '';
$precipitation = '';
$sunrise = '';
$sunset = '';
$temp = '';
$wind_gust = '';
$weather_code = '';

// Tableau qui contiendra toutes les informations à retourner.
$result = [];


/** --------------------------------------------------------
 *      Récupération des données retournées par l'API.
 * --------------------------------------------------------- */

$city = $decoded_json['city_name'];

for ($i = 0; $i < DAYS; $i++) {
	foreach ($decoded_json['data'][$i] as $key => $value) {

		if ($key == "weather")
			$weather_code = $value['code'];
		
		/**
		 * Récupérer la date et la convertir dans différents fomats:
		 * 
		 *   - $date_month: nombre du jour du mois (1-31) + nom complet du mois.
		 *   - $date: Jour de la semaine complet + $date_month
		 *   - $day: nom complet du jour de la semaine.
		 */
		if ($key == "valid_date") {
			$date_time = new DateTime($value);

			$date_month = $date_time->format('j F');
			$date = ($date_month == $today) ? 'Today ' . $today : $date_time->format('l j F');
			$day = ($date_month == $today) ? 'Today' : $date_time->format('l');
		}
		
		/**
		 * Conversion des timestamps des levers et couchers de soleil au
		 * format Heures:Minutes.
		 */
		if ($key == "sunrise_ts")
			$sunrise = gmdate('H:i', $value);
		
		if ($key == "sunset_ts")
			$sunset = gmdate('H:i', $value);

		if ($key == "precip")
			$precipitation = round($value, 1);

		if ($key == "temp")
			$temp = round($value);

		if ($key == "pod")
			$pod = ($value == 'n') ? "night" : "day";
		
		// La vitesse du vent étant en noeuds, la convertir en km/h puis
		// arrondir le résultat.
		if ($key == "wind_gust_spd") 
			$wind_gust = round($value * 3.6, 1);

	}
	
	$result[$i] = [
        'city'        => $city,
		'date'        => $date,
        'actualDay'   => $day,
		'weatherCode' => $weather_code,
		'wind'        => $wind_gust,
		'temp'        => $temp,
		'precip'      => $precipitation,
		'sunrise'     => $sunrise,
		'sunset'      => $sunset,
	];
}


// Retourner une version encodée du tableau de données
echo json_encode($result);

?>