import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Loader } from "@googlemaps/js-api-loader"
import { AngularFireFunctions, AngularFireFunctions as Functions } from '@angular/fire/compat/functions';
import { environment } from '../environments/environment';
import { ReCaptchaV3Service } from 'ng-recaptcha';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  
public map: google.maps.Map | undefined = undefined;
@ViewChild('map')
public mapElement: any;
public circles: google.maps.Circle[] = []; // To store the circle objects
public markers: google.maps.Marker[] = []; // To store the marker objects
public curLocMarker: any;
public standort = "";


constructor(private fns: AngularFireFunctions, 
            private recaptchaV3Service: ReCaptchaV3Service) {

}


ngAfterViewInit(): void {
  const loader = new Loader({
  apiKey: environment.googleMapsKey,
  version: "weekly",
  });


  loader.importLibrary('maps').then(maps => {
    this.map = new maps.Map(this.mapElement.nativeElement, {
      center: { lat: 51.1657, lng: 10.4515 }, // Center the map on Germany
      zoom: 6, // Adjust the zoom level as needed
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });
  })
}

ngOnInit(): void {
}


// Callback function to handle the search results
public handleResults(results: any) {
  const lat = results.place.geometry.location.lat;
  const lng = results.place.geometry.location.lng;

  // Remove existing circles from the map
  this.clearCircles();
  this.clearMarkers();
  // Loop through the results and create markers
  for (const place of results.sushiRestaurants) {
    this.createMarker(place);
  }

  this.setCurrentMarker(results.place.geometry.location)

  // Zentriere die Karte auf den eingegebenen Standort
  if(this.map) {
    this.map.setCenter({ lat: lat, lng: lng });
    this.map.setZoom(10);
  }
}

// Create a marker for each sushi restaurant
public createMarker(place: any) {
  const marker = new google.maps.Marker({
    position: place.geometry.location,
    map: this.map!,
    title: place.name,
    icon: {
      path: google.maps.SymbolPath.BACKWARD_OPEN_ARROW,
      scale: 5, // Größe des Symbols
      fillColor: 'black', // Farbe des Symbols
      fillOpacity: 0.0, // Transparenz des Symbols
      strokeWeight: 0, // Dicke des Randes
    },
    label: {
      text: '🍣' + (place.rating >= 4.8 && place.user_ratings_total >= 100 ? '⭐' : place.rating), // Hier das gewünschte Emoji einfügen
      fontSize: '24px', // Größe des Emoji
    }
  });

  // Add an event listener to the marker to display additional information on click
  marker.addListener('click', () => {
    // Customize the content displayed in the info window
    const content = `<h3>${place.name}</h3><p>${place.vicinity}</p>`;
    const infoWindow = new google.maps.InfoWindow({ content: content });
    infoWindow.open(this.map!, marker);
  });
  this.markers.push(marker); // Store the marker object in the array


  const numSteps = 4; // Anzahl der Schritte
  const maxRadius = 15000; // Maximaler Radius in Metern
  for (let i = 0; i < numSteps; i++) {
    const radius = (i / numSteps) * maxRadius;
    const fillOpacity = 1 - i / numSteps; // Linearer Fade-Effekt


    // Create a transparent circle around the marker
    const circle = new google.maps.Circle({
      strokeColor: 'transparent', // Set the border color to transparent
      strokeOpacity: 0,
      strokeWeight: 0,
      fillColor: '#008000', // Set the fill color (e.g., red)
      fillOpacity: fillOpacity * .2, // Set the fill opacity (0.0 to 1.0, 0.0 being fully transparent)
      map: this.map!,
      center: place.geometry.location,
      radius: radius, // Radius in meters (adjust as needed)
    });

    this.circles.push(circle); // Store the circle object in the array
  }
}

public clearCircles() {
  // Remove all circles from the map
  for (const circle of this.circles) {
    circle.setMap(null);
  }
  this.circles = []; // Clear the array
}

public clearMarkers() {
  // Remove all markers from the map
  for (const marker of this.markers) {
    marker.setMap(null);
  }
  this.markers = []; // Clear the array
}

public setCurrentMarker(location: any) {
  if (this.curLocMarker) {
    this.curLocMarker.setPosition(location);
  } else {
    const marker = new google.maps.Marker({
      position: location,
      map: this.map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 7, // Größe des Symbols
        fillColor: 'red', // Farbe des Symbols
        fillOpacity: 1, // Transparenz des Symbols
        strokeWeight: 1, // Dicke des Randes
      },
      label: {
        text: '🧍', // Hier das gewünschte Emoji einfügen
        fontSize: '24px', // Größe des Emoji
      }
    });
    this.curLocMarker = marker;
  }
  // Store the marker object in the array
}

public sucheNachSushiRestaurants() {
  this.getSushiRestaurants(this.standort);
}

public getSushiRestaurants(placeInput: any) {
  
    
    this.recaptchaV3Service.execute('importantAction')
      .subscribe((token) => {
          const sushi = this.fns.httpsCallable('sushi');
          const data = sushi({ placeInput, token });
          data.subscribe(res => {
            this.handleResults(res as {place: any, sushiRestaurants: any[]});
          });
      });
}
}
