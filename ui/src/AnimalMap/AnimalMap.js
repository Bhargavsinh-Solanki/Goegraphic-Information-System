import { Autocomplete, Button, Grid, TextField } from "@mui/material";
import {
	amber,
	blue,
	blueGrey,
	brown,
	cyan,
	deepOrange,
	deepPurple,
	green,
	grey,
	indigo,
	lightBlue,
	lightGreen,
	lime,
	orange,
	pink,
	purple,
	red,
	yellow,
} from "@mui/material/colors";
import Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import {
	getAnimalsLifeTimeSimplifiedPaths,
	getAnimalsWithFirstLocation,
	getAnimalsWithLastLocation,
	getStudyNames,
} from "../services/animals-service";

Leaflet.Icon.Default.imagePath = "../node_modules/leaflet";

delete Leaflet.Icon.Default.prototype._getIconUrl;
var buttonLayeridMap = {};
Leaflet.Icon.Default.mergeOptions({
	iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
	//	iconUrl: require("leaflet/dist/images/marker-icon.png"),
	iconUrl: require("leaflet/dist/images/marker-icon.png"),

	shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});
var map;
const AnimalMap = (props) => {
	const [position, setposition] = useState([47.687017, 9.177524]);
	const [zoom, setzoom] = useState(3);

	const [animalSet, setanimalSet] = useState([
		{ name: "Long-Tailed Duck", tags: ["Air"] },
		{ name: "White Shark", tags: ["Aqua"] },
		{ name: "Galapagous Turtle", tags: ["Aqua"] },
	]);
	const [animalNameSet, setanimalNameSet] = useState([]);
	const [tagMap, settagMap] = useState({});
	const [tabValue, settabValue] = useState("one");

	const [featureSet, setfeatureSet] = useState(["Air", "Aqua", "Sea"]);
	const [animalsOnTheMap, setanimalsOnTheMap] = useState([]);
	const [disabledAerial, setdisabledAerial] = useState(false);
	const [disabledAqua, setdisabledAqua] = useState(false);
	const [disabledLand, setdisabledLand] = useState(false);

	const [searchBoxValue, setsearchBoxValue] = useState("");
	const [selectedValueSearchBar, setselectedValueSearchBar] = useState("");
	const [selectedAnimals, setselectedAnimals] = useState([]);
	const [colorSet, setcolorSet] = useState([
		purple,
		amber,
		lightBlue,
		lightGreen,
		red,
		blue,
		blueGrey,
		brown,
		cyan,
		deepOrange,
		deepPurple,
		green,
		grey,
		indigo,
		pink,
		yellow,
		lime,
		orange,
	]);
	const [colorNameSet, setcolorNameSet] = useState([
		"red",
		"green",
		"orange",
		"#4E41B0",
		"purple",
		"brown",
		"cyan",
		"grey",
		"indigo",
		"lime",
		"#450E23",
		"#C41B5C",
		"blue",
		"#6F4682",
		"#5E8F8F",
		"violet",
		"#6078C4",
	]);

	// const ColorButton = styled(Button)(({ theme }) => {
	// 	console.log(Button);
	// 	console.log(theme);

	// 	return {
	// 		color: theme.palette.getContrastText(colorSet[2][500]),
	// 		backgroundColor: colorSet[2][500],
	// 		"&:hover": {
	// 			backgroundColor: colorSet[2][700],
	// 		},
	// 	};
	// });
	const onMarkerClick = (e) => {
		console.log("marker clicked ", e);
	};

	useEffect(() => {
		getStudyNames().then((res) => {
			console.log(res);
			var nameSet = [];
			setanimalSet(res);
			var newTagMap = {};
			// console.log("getStudyNames Result: ", res);
			var animals = res.map((e) => {
				newTagMap[e.name] = e.type;
				nameSet.push(e.name);
			});
			// console.log("animals: ", animals);
			// console.log("nameSet : ", nameSet);
			setanimalNameSet(nameSet);
			settagMap(newTagMap);
		});
	}, []);
	const onEachFeatu = (feature, layer) => {
		// console.log("added ", feature, layer);
		var [type, study, individual_tag, epsilon] = feature.id.split("#");
		if (!buttonLayeridMap[study]) buttonLayeridMap[study] = {};
		if (!buttonLayeridMap[study][type]) buttonLayeridMap[study][type] = [];
		buttonLayeridMap[study][type].push(feature);
		// console.log(type, study, individual_tag, epsilon);

		if (type == "Point") {
			{
				var obj = {
					Individual: individual_tag,
					Date: moment(feature.properties.timestamp).format("LLL"),
					Study_Name: study,
				};
				// console.log(moment(feature.properties.timestamp).format("LLL"));
				layer.bindPopup(
					"<div><pre>" +
						JSON.stringify(obj, null, " ").replace(/[\{\}"]/g, "") +
						"</pre></div>",
					{
						closeButton: false,
						offset: Leaflet.point(0, -20),
						maxWidth: 500,
					}
				);

				layer.on("mouseover", function (action) {
					layer.openPopup();
					// console.log(buttonLayeridMap[study].Start_Point);
					var correspondingLineLayer = buttonLayeridMap[study].Line_Layer; // buttonLayeridMap[study].Line.find(
					// 	(e) => e.properties.individual_local_identifier == individual_tag);
					var correspondingStartingPoint = buttonLayeridMap[study].Start_Point;
					correspondingStartingPoint.setStyle((e) =>
						createLineStyleForStartingPoint(
							e,
							study,
							action.target.feature.id.replace("Point#", "Start_Point#")
						)
					);
					correspondingLineLayer.setStyle((e) =>
						createLineStyle(e, study, individual_tag)
					);
				});
				layer.on("mouseout", function () {
					layer.closePopup();

					var correspondingLineLayer = buttonLayeridMap[study].Line_Layer; // buttonLayeridMap[study].Line.find(
					// 	(e) => e.properties.individual_local_identifier == individual_tag);
					var correspondingStartingPoint = buttonLayeridMap[study].Start_Point;
					correspondingStartingPoint.setStyle((e) => {
						return {
							radius: 8,
							fillColor: getColorForStudy(study),
							color: getColorForStudy(study),
							zIndexOffset: 1,
							color: "#000",
							weight: 4,
							opacity: 0,
							fillOpacity: 0.8,
						};
					});
					correspondingLineLayer.setStyle((e) =>
						createLineStyleDefault(e, study, individual_tag)
					);
				});
			}
		} else if (type == "Line") {
			{
				layer.on("mouseover", function (action) {
					// console.log("Line : ", action);
					//Point#Andean Condor Vultur gryphus Bariloche, Argentina, 2013-2018#1#0  Line#Andean Condor Vultur gryphus Bariloche, Argentina, 2013-2018#1#0.02
					var correspondingLineLayer = buttonLayeridMap[study].Line_Layer; // buttonLayeridMap[study].Line.find(
					// 	(e) => e.properties.individual_local_identifier == individual_tag);
					var correspondingStartingPoint = buttonLayeridMap[study].Start_Point;
					correspondingStartingPoint.setStyle((e) => {
						var [type, study, tag, epsilon] = action.target.feature.id
							.replace("Line#", "Start_Point#")
							.split("#");
						epsilon = "0";
						var uniqueidentifier =
							type + "#" + study + "#" + tag + "#" + epsilon;
						return createLineStyleForStartingPoint(e, study, uniqueidentifier);
					});
					correspondingLineLayer.setStyle((e) =>
						createLineStyle(e, study, individual_tag)
					);
				});
				layer.on("mouseout", function (action) {
					var correspondingLineLayer = buttonLayeridMap[study].Line_Layer; // buttonLayeridMap[study].Line.find(
					// 	(e) => e.properties.individual_local_identifier == individual_tag);
					var correspondingStartingPoint = buttonLayeridMap[study].Start_Point;
					correspondingStartingPoint.setStyle((e) => {
						return {
							radius: 8,
							fillColor: getColorForStudy(study),
							color: getColorForStudy(study),
							zIndexOffset: 1,
							color: "#000",
							weight: 4,
							opacity: 0,
							fillOpacity: 0.8,
						};
					});
					correspondingLineLayer.setStyle((e) =>
						createLineStyleDefault(e, study, individual_tag)
					);
				});
			}
		}

		return;
	};
	const createLineStyleForStartingPoint = (e, study, layer_id) => {
		var [type, study, individual_tag_from_id, epsilon] = e.id.split("#");
		// console.log(e, individual_tag, individual_tag_from_id);
		// console.log(e.id, layer_id);
		var geojsonMarkerOptions = {
			radius: 8,
			fillColor: getColorForStudy(study),
			color: getColorForStudy(study),
			zIndexOffset: 1,
			color: "#000",
			weight: 4,
			opacity: e.id == layer_id ? 0.7 : 0,
			fillOpacity: 0.8,
			riseOnHover: true,
		};

		return geojsonMarkerOptions;
	};
	const createLineStyle = (e, study, individual_tag) => {
		// console.log(e, e.properties.individual_local_identifier);
		var myStyle = {
			color: getColorForStudy(study),
			weight:
				individual_tag == e.properties.individual_local_identifier ? 4 : 2,
			opacity:
				individual_tag == e.properties.individual_local_identifier ? 0.8 : 0.3,
		};

		return myStyle;
	};
	const createLineStyleDefault = (e, study, individual_tag) => {
		// console.log(e, e.properties.individual_local_identifier);
		var myStyle = {
			color: getColorForStudy(study),
			weight: 2,
			opacity: 0.3,
		};

		return myStyle;
	};

	const firstFunction = () => {
		// console.log("firstFunction s");
	};
	const addAnimalToMapByStudyName = (val) => {
		if (!val) return;
		var geojsonMarkerOptions = {
			radius: 8,
			fillColor: getColorForStudy(val),
			color: "#000",
			weight: 4,
			zIndexOffset: 1,
			opacity: 0.7,
			fillOpacity: 0.8,
			riseOnHover: true,
		};
		var myStyle = {
			color: getColorForStudy(val),
			weight: 2,
			opacity: 0.3,
		};
		getAnimalsWithLastLocation({ study_name: val })
			.then((res) => {
				// if (res && res.length) console.log(res[0]);
				var added = Leaflet.geoJSON(res, {
					pointToLayer: (geoJsonPoint, latlng) =>
						Leaflet.circleMarker(latlng, geojsonMarkerOptions),
					onEachFeature: onEachFeatu,
				}).addTo(map);

				// setMap(mapobj);
				buttonLayeridMap[val]["Point_Layer"] = added;
				// console.log(
				// 	"getAnimalsWithLastLocation res => ",
				// 	res,
				// 	added
				// );
				// // added = Leaflet.geoJSON(res, {
				// 	pointToLayer: (geoJsonPoint, latlng) =>
				// 		Leaflet.marker(latlng, {
				// 			...geojsonMarkerOptions,
				// 			icon: Leaflet.divIcon({ className: "fas fa-wind",zIndexOffset:1 }),
				// 		}),
				// 	onEachFeature: onEachFeatu,
				// }).addTo(map);
			})
			.catch((err) => console.log(err));
		getAnimalsWithFirstLocation({ study_name: val })
			.then((res) => {
				// if (res && res.length) console.log(res[0]);
				var added = Leaflet.geoJSON(res, {
					pointToLayer: (
						geoJsonPoint,
						latlng //Leafle.
					) =>
						Leaflet.circleMarker(latlng, {
							...geojsonMarkerOptions,
							opacity: 0,
							fill: false,
						}),
					onEachFeature: onEachFeatu,
				}).addTo(map);

				// setMap(mapobj);
				buttonLayeridMap[val]["Start_Point"] = added;
				console.log("getAnimalsWithLastLocation res => ", res, added);
			})
			.catch((err) => console.log(err));

		getAnimalsLifeTimeSimplifiedPaths({ study_name: val })
			.then((res) => {
				// console.log(
				// 	"getAnimalsLifeTimeSimplifiedPaths res => ",
				// 	res
				// );

				var added = Leaflet.geoJSON(res, {
					onEachFeature: onEachFeatu,
					style: (geoJsonFeature) => {
						// console.log(geoJsonFeature);
						return myStyle;
					},
				}).addTo(map);
				if (!buttonLayeridMap[val]) buttonLayeridMap[val] = {};
				buttonLayeridMap[val]["Line_Layer"] = added;

				// setMap(mapobj);

				// var mapobj = map;

				// Leaflet.geoJSON(res, {
				// 	pointToLayer: function (feature, latlng) {
				// 		return Leaflet.circleMarker(
				// 			latlng,
				// 			geojsonMarkerOptions
				// 		);
				// 	},
				// }).addTo(mapobj);
				// setMap(mapobj);
			})
			.catch((err) => console.log(err));
		// console.log("selectedValueSearchBar : ", val);
		var animalArr = selectedAnimals;
		var nameSet = animalNameSet;
		animalArr.push(val);
		setselectedAnimals(animalArr);
		setselectedValueSearchBar(val);
		setsearchBoxValue(val);
		nameSet = nameSet.filter((e) => e != val);
		setanimalNameSet(nameSet);
	};
	const deleteAnimalFromMapByStudyName = (study_name) => {
		var selectedArr = selectedAnimals;
		selectedArr = selectedArr.filter((elem) => elem != study_name);
		// console.log(buttonLayeridMap);

		if (buttonLayeridMap[study_name]["Line_Layer"]) {
			buttonLayeridMap[study_name]["Line_Layer"].removeFrom(map);
		}
		if (buttonLayeridMap[study_name]["Point_Layer"])
			buttonLayeridMap[study_name]["Point_Layer"].removeFrom(map);
		if (buttonLayeridMap[study_name]["Start_Point"])
			buttonLayeridMap[study_name]["Start_Point"].removeFrom(map);
		buttonLayeridMap[study_name] = {};
	};
	const getColorForStudy = (study) => {
		return colorNameSet[getIndexFromStudy(study)];
	};
	const getIndexFromStudy = (study) => {
		if (study == "3D flights of European free-tailed bats") return 0;
		else if (
			study == "Andean Condor Vultur gryphus Bariloche, Argentina, 2013-2018"
		)
			return 1;
		else if (
			study == "Bald Eagle (Haliaeetus leucocephalus) in the Pacific Northwest"
		)
			return 2;
		else if (study == "Black-backed jackal, Etosha National Park, Namibia")
			return 3;
		else if (
			study ==
			"Blue and fin whales Southern California 2014-2015 - Fastloc GPS data"
		)
			return 4;
		// else if (study == "Caspian Gulls - Poland") return 5;
		else if (study == "Common Crane Lithuania GPS, 2016") return 6;
		else if (study == "Fin whales Gulf of California 2001 - Argos data")
			return 7;
		else if (study == "Galapagos Albatrosses") return 8;
		// else if (study == "Long-tailed ducks GLS 2018") return 9;
		else if (study == "Short-eared Owl, North America") return 10;
		else if (study == "Migrations of Common Terns (Sterna hirundo)") return 11;
		else if (study == "MPIAB White Stork Oriental Argos") return 12;
		else if (
			study == "Peregrine Falcon, High Arctic Institute, northwest Greenland"
		)
			return 13;
		else if (study == "Pernis_apivorus_Byholm _Finland") return 14;
		else if (study == "Red Kite MPI-AB Baden-Wuerttemberg") return 15;
		else console.log("color not found for ", study);
		return 16;
	};
	const renderAnimalWithRemoveButton = (e, index) => {
		return (
			<Button
				variant="outlined"
				style={{
					marginTop: 10,
					color: getColorForStudy(e),
					borderColor: getColorForStudy(e),
				}}
				value={e}
				key={index}
				onClick={(e, val) => {
					var study_name = e.target.value;
					var selectedArr = selectedAnimals;
					if (!study_name) study_name = e.target.textContent;
					selectedArr = selectedArr.filter((elem) => elem != study_name);
					console.log("study_name : ", study_name);
					if (buttonLayeridMap[study_name]["Line_Layer"]) {
						buttonLayeridMap[study_name]["Line_Layer"].removeFrom(map);
					}
					if (buttonLayeridMap[study_name]["Point_Layer"])
						buttonLayeridMap[study_name]["Point_Layer"].removeFrom(map);
					if (buttonLayeridMap[study_name]["Start_Point"])
						buttonLayeridMap[study_name]["Start_Point"].removeFrom(map);
					buttonLayeridMap[study_name] = {};

					setselectedAnimals(selectedArr);
					var nameSet = animalNameSet;
					nameSet.push(study_name);
					setanimalNameSet(nameSet);
					setdisabledAerial(false);
					setdisabledAqua(false);
					setdisabledLand(false);
				}}
			>
				<div flex style={{ display: "flex", flexDirection: "row" }}>
					{/* <div style={{ alignSelf: "center" }}>
						<i color={getColorForStudy(e)} class="fas fa-wind fa-2x"></i>
					</div> */}
					{e}
				</div>
			</Button>
		);
	};
	return (
		<div class="container" style={{ margin: 20 }}>
			{/* <div>
				<Button onClick={() => console.log(map)}>MAP</Button>
				<Button onClick={() => console.log(buttonLayeridMap)}>
					Button Layer
				</Button>
			</div> */}
			<div class="container" style={{ display: "flex" }}>
				<div id="map" style={{ flex: 4 }}>
					<div>
						{/* <div class="container" style={{ flexDirection: "row", height: 50 }}>
							<Tabs
								centered
								value={tabValue}
								onChange={(e, r, t) => settabValue(r)}
								textColor="secondary"
								indicatorColor="secondary"
								aria-label="secondary tabs example"
							>
								<Tab
									value="one"
									label={
										<span style={{ fontSize: 10 }}>{"Animal Locations"}</span>
									}
								/>
								<Tab
									value="two"
									label={<span style={{ fontSize: 10 }}>{"Living Areas"}</span>}
								/>
								<Tab
									value="three"
									label={<span style={{ fontSize: 10 }}>{"Analysis"}</span>}
								/>
							</Tabs>
						</div> */}
					</div>
					<div>
						<MapContainer
							center={position}
							zoom={zoom}
							style={{ height: 800 }}
							whenCreated={(map2) => {
								map2.on("contextmenu", (e, r, t) =>
									console.log("right clicked")
								);
								map = map2;

								// setMap(map);
							}}
							whenReady={firstFunction}
						>
							<TileLayer
								attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
								url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
							/>
							{/* <Marker position={position}>
								<Popup>Son Konum</Popup>
							</Marker> */}
						</MapContainer>
					</div>
				</div>

				<div
					id="filter-container"
					style={{
						paddingLeft: 10,
						flex: 1,
						maxWidth: 330,
						height: 800,
						flexDirection: "column",
					}}
				>
					<div style={{ height: 175, flex: 3 }}>
						<h3 style={{ textAlign: "center", color: "#1976D2" }}>
							Select Animals By Habitats
						</h3>
						<Grid container spacing={2}>
							<Grid item xs={4}>
								<Button
									variant="outlined"
									style={{
										marginTop: 10,
										// color: getColorForStudy(e),
										// borderColor: getColorForStudy(e),
									}}
									disabled={disabledAerial}
									onClick={(e) => {
										console.log(tagMap);
										var filteredList = [];
										var futureselectionList = [];
										for (var study in tagMap) {
											console.log(study, tagMap[study]);
											if (tagMap[study] == "Aerial") {
												filteredList.push(study);

												if (!selectedAnimals.includes(study))
													addAnimalToMapByStudyName(study);
											} else futureselectionList.push(study);
										}
										console.log("aerials : ", filteredList);
										for (var animal of selectedAnimals)
											if (!filteredList.includes(animal))
												deleteAnimalFromMapByStudyName(animal);

										console.log(selectedAnimals);
										setselectedAnimals(filteredList);
										setanimalNameSet(futureselectionList);
										setdisabledAerial(true);
										setdisabledAqua(false);
										setdisabledLand(false);

										return;
									}}
								>
									<div
										flex
										style={{ display: "flex", flexDirection: "column" }}
									>
										<div style={{ alignSelf: "center" }}>
											<i color={"pink"} class="fas fa-wind fa-2x"></i>
										</div>
										<div>Aerial</div>
									</div>
								</Button>
							</Grid>
							<Grid item xs={4}>
								<Button
									variant="outlined"
									disabled={disabledLand}
									style={{
										marginTop: 10,
										// color: getColorForStudy(e),
										// borderColor: getColorForStudy(e),
									}}
									onClick={(e) => {
										console.log(tagMap);
										var filteredList = [];
										var futureselectionList = [];

										for (var study in tagMap) {
											console.log(study, tagMap[study]);
											if (tagMap[study] == "Terrestrial") {
												filteredList.push(study);

												if (!selectedAnimals.includes(study))
													addAnimalToMapByStudyName(study);
											} else futureselectionList.push(study);
										}
										console.log("Terrestrials : ", filteredList);
										for (var animal of selectedAnimals)
											if (!filteredList.includes(animal))
												deleteAnimalFromMapByStudyName(animal);

										console.log(selectedAnimals);
										setanimalNameSet(futureselectionList);

										setselectedAnimals(filteredList);
										setdisabledAerial(false);
										setdisabledAqua(false);
										setdisabledLand(true);

										return;
									}}
								>
									<div
										flex
										style={{ display: "flex", flexDirection: "column" }}
									>
										<div style={{ alignSelf: "center" }}>
											<i color={"pink"} class="fas fa-paw fa-2x"></i>
										</div>
										<div>Land</div>
									</div>
								</Button>
							</Grid>
							<Grid item xs={4}>
								<Button
									disabled={disabledAqua}
									variant="outlined"
									style={{
										marginTop: 10,
										// color: getColorForStudy(e),
										// borderColor: getColorForStudy(e),
									}}
									onClick={(e) => {
										console.log(tagMap);
										var filteredList = [];

										var futureselectionList = [];

										for (var study in tagMap) {
											console.log(study, tagMap[study]);
											if (tagMap[study] == "Aquatic") {
												filteredList.push(study);

												if (!selectedAnimals.includes(study))
													addAnimalToMapByStudyName(study);
											} else futureselectionList.push(study);
										}
										console.log("Aquatics : ", filteredList);
										for (var animal of selectedAnimals)
											if (!filteredList.includes(animal))
												deleteAnimalFromMapByStudyName(animal);

										console.log(selectedAnimals);
										setselectedAnimals(filteredList);
										setanimalNameSet(futureselectionList);

										setdisabledAerial(false);
										setdisabledAqua(true);
										setdisabledLand(false);

										return;
									}}
								>
									<div
										flex
										style={{ display: "flex", flexDirection: "column" }}
									>
										<div style={{ alignSelf: "center" }}>
											<i color={"pink"} class="fas fa-water fa-2x"></i>
										</div>
										<div>Aqua</div>
									</div>
								</Button>
							</Grid>
						</Grid>
					</div>
					<div>
						<div style={{ height: 60 }}>
							<Autocomplete
								disablePortal
								id="combo-box-demo"
								disableCloseOnSelect
								options={animalNameSet}
								value={selectedValueSearchBar}
								onChange={(event, val) => {
									if (!val) return;
									var geojsonMarkerOptions = {
										radius: 8,
										fillColor: getColorForStudy(val),
										color: "#000",
										weight: 4,
										zIndexOffset: 1,
										opacity: 0.7,
										fillOpacity: 0.8,
										riseOnHover: true,
									};
									var myStyle = {
										color: getColorForStudy(val),
										weight: 2,
										opacity: 0.3,
									};
									getAnimalsWithLastLocation({ study_name: val })
										.then((res) => {
											if (res && res.length) console.log(res[0]);
											var added = Leaflet.geoJSON(res, {
												pointToLayer: (geoJsonPoint, latlng) =>
													Leaflet.circleMarker(latlng, geojsonMarkerOptions),
												onEachFeature: onEachFeatu,
											}).addTo(map);

											// setMap(mapobj);
											buttonLayeridMap[val]["Point_Layer"] = added;
											// console.log(
											// 	"getAnimalsWithLastLocation res => ",
											// 	res,
											// 	added
											// );
											// // added = Leaflet.geoJSON(res, {
											// 	pointToLayer: (geoJsonPoint, latlng) =>
											// 		Leaflet.marker(latlng, {
											// 			...geojsonMarkerOptions,
											// 			icon: Leaflet.divIcon({ className: "fas fa-wind",zIndexOffset:1 }),
											// 		}),
											// 	onEachFeature: onEachFeatu,
											// }).addTo(map);
										})
										.catch((err) => console.log(err));
									getAnimalsWithFirstLocation({ study_name: val })
										.then((res) => {
											if (res && res.length) console.log(res[0]);
											var added = Leaflet.geoJSON(res, {
												pointToLayer: (
													geoJsonPoint,
													latlng //Leafle.
												) =>
													Leaflet.circleMarker(latlng, {
														...geojsonMarkerOptions,
														opacity: 0,
														fill: false,
													}),
												onEachFeature: onEachFeatu,
											}).addTo(map);

											// setMap(mapobj);
											buttonLayeridMap[val]["Start_Point"] = added;
											console.log(
												"getAnimalsWithLastLocation res => ",
												res,
												added
											);
										})
										.catch((err) => console.log(err));

									getAnimalsLifeTimeSimplifiedPaths({ study_name: val })
										.then((res) => {
											// console.log(
											// 	"getAnimalsLifeTimeSimplifiedPaths res => ",
											// 	res
											// );

											var added = Leaflet.geoJSON(res, {
												onEachFeature: onEachFeatu,
												style: (geoJsonFeature) => {
													// console.log(geoJsonFeature);
													return myStyle;
												},
											}).addTo(map);
											buttonLayeridMap[val]["Line_Layer"] = added;

											// setMap(mapobj);

											// var mapobj = map;

											// Leaflet.geoJSON(res, {
											// 	pointToLayer: function (feature, latlng) {
											// 		return Leaflet.circleMarker(
											// 			latlng,
											// 			geojsonMarkerOptions
											// 		);
											// 	},
											// }).addTo(mapobj);
											// setMap(mapobj);
										})
										.catch((err) => console.log(err));
									// console.log("selectedValueSearchBar : ", val);
									var animalArr = selectedAnimals;
									var nameSet = animalNameSet;
									animalArr.push(val);
									setselectedAnimals(animalArr);
									setselectedValueSearchBar(val);
									setsearchBoxValue(val);
									nameSet = nameSet.filter((e) => e != val);
									setanimalNameSet(nameSet);
								}}
								inputValue={searchBoxValue}
								onInputChange={(event, inpVal) => {
									// console.log("searchBoxValue : ", inpVal);

									setsearchBoxValue(inpVal);
								}}
								renderInput={(params) => (
									<TextField {...params} label="Animal" />
								)}
							/>
						</div>
						<div flex style={{ flex: 1, flexDirection: "column" }}>
							{selectedAnimals.length > 0
								? selectedAnimals.map((e, index) =>
										renderAnimalWithRemoveButton(e, index)
								  )
								: null}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AnimalMap;

// elif study_name_sample == 'Short-eared Owl, North America':
//             epsilon=7
//         elif study_name_sample == 'Migrations of Common Terns (Sterna hirundo)':
//             epsilon=10
//         elif study_name_sample == 'MPIAB White Stork Oriental Argos':
//             epsilon=3
//         elif study_name_sample == 'Peregrine Falcon, High Arctic Institute, northwest Greenland':
//             epsilon=2
//         elif study_name_sample == 'Pernis_apivorus_Byholm _Finland':
//             epsilon=19
//         elif study_name_sample == 'Red Kite MPI-AB Baden-Wuerttemberg':
//             epsilon=0.15
