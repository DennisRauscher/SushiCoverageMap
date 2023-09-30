import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core'
import { Loader } from '@googlemaps/js-api-loader'
import { environment } from '../environments/environment'
import { ReCaptchaV3Service } from 'ng-recaptcha'
import { AngularFireFunctions } from '@angular/fire/compat/functions'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  public map: google.maps.Map | undefined = undefined
  @ViewChild('map')
  public mapElement: ElementRef<HTMLDivElement> | undefined = undefined;

  public circles: google.maps.Circle[] = [] // To store the circle objects
  public markers: google.maps.Marker[] = [] // To store the marker objects
  public curLocMarker: google.maps.Marker | undefined = undefined;
  public standort = ''
  public isLoading = false;
  public isSearchComplete = false;
  public totalScore = 0;

  constructor(private readonly fns: AngularFireFunctions,
    private readonly recaptchaV3Service: ReCaptchaV3Service) {

  }

  ngAfterViewInit(): void {
    const loader = new Loader({
      apiKey: environment.googleMapsKey,
      version: 'weekly'
    })

    loader.importLibrary('maps').then(maps => {
      if (this.mapElement) {
        this.map = new maps.Map(this.mapElement.nativeElement, {
          center: { lat: 51.1657, lng: 10.4515 }, // Center the map on Germany
          zoom: 6, // Adjust the zoom level as needed
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'all',
              elementType: 'all',
              stylers: [
                { saturation: -100 } // Set saturation to -100 to achieve grayscale
              ]
            }
          ]
        })
      }
    }).catch((error) => { console.log(error) })
  }

  // Callback function to handle the search results
  public handleResults(results: any): void {
    const lat = results.place.geometry.location.lat
    const lng = results.place.geometry.location.lng

    // Remove existing circles from the map

    this.setCurrentMarker(results.place.geometry.location)
    this.totalScore = 0;

    this.clearCircles()
    this.clearMarkers()
    // Loop through the results and create markers
    for (let i = 0; i < results.sushiRestaurants.length; i++) {
      const place = results.sushiRestaurants[i];
      setTimeout(() => {
        this.createMarker(place)
      }, 200 * i);
    }

    // Zentriere die Karte auf den eingegebenen Standort
    if (this.map !== undefined) {
      this.map.setCenter({ lat, lng });
      this.map.setZoom(12);
    }
  }

  // Create a marker for each sushi restaurant
  public createMarker(place: any): void {
    const marker = new google.maps.Marker({
      position: place.geometry.location,
      map: this.map,
      title: place.name,
      icon: {
        path: google.maps.SymbolPath.BACKWARD_OPEN_ARROW,
        scale: 5, // Größe des Symbols
        fillColor: 'black', // Farbe des Symbols
        fillOpacity: 0.0, // Transparenz des Symbols
        strokeWeight: 0 // Dicke des Randes
      },
      label: {
        text: '🍣' + (place.rating >= 4.8 && place.user_ratings_total >= 100 ? '⭐' : place.rating), // Hier das gewünschte Emoji einfügen
        fontSize: '24px' // Größe des Emoji
      }
    })

    // Add an event listener to the marker to display additional information on click
    marker.addListener('click', () => {
      // Customize the content displayed in the info window
      const content = `<h3>${place.name}</h3><p>${place.vicinity}</p>`
      const infoWindow = new google.maps.InfoWindow({ content })
      infoWindow.open(this.map, marker)
    })
    this.markers.push(marker) // Store the marker object in the array

    const numSteps = 4 // Anzahl der Schritte
    const maxRadius = 15000 // Maximaler Radius in Metern
    for (let i = 0; i < numSteps; i++) {

      setTimeout(() => {
        const radius = (i / numSteps) * maxRadius
        const fillOpacity = 1 - i / numSteps // Linearer Fade-Effekt
        // Create a transparent circle around the marker
        const circle = new google.maps.Circle({
          strokeColor: 'transparent', // Set the border color to transparent
          strokeOpacity: 0,
          strokeWeight: 0,
          fillColor: '#ffc020', // Set the fill color (e.g., red)
          fillOpacity: fillOpacity * 0.1, // Set the fill opacity (0.0 to 1.0, 0.0 being fully transparent)
          map: this.map,
          center: place.geometry.location,
          radius: 0, // Radius in meters (adjust as needed)
          zIndex: 0
        })

        this.circles.push(circle); // Store the circle object in the array
        this.addCircleToScore(numSteps - i, circle, radius);
        this.animateCircleGrow(circle, radius);
      }, 300 * i);
    }
  }

  public clearCircles(): void {
    // Remove all circles from the map
    for (const circle of this.circles) {
      circle.setMap(null)
    }
    this.circles = [] // Clear the array
  }

  public clearMarkers(): void {
    // Remove all markers from the map
    for (const marker of this.markers) {
      marker.setMap(null)
    }
    this.markers = [] // Clear the array
  }

  public animateCircleGrow(circle: google.maps.Circle, finalRadius: number): void {
    const animationDuration = 1000; // Animation duration in milliseconds
    const initialRadius = circle.getRadius();
    const step = (finalRadius - initialRadius) / (animationDuration / 16); // 16ms per frame

    const animate = () => {
      const currentRadius = circle.getRadius();
      if (currentRadius < finalRadius) {
        circle.setRadius(currentRadius + step);
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  public setCurrentMarker(location: google.maps.LatLng): void {
    if (this.curLocMarker !== undefined) {
      this.curLocMarker.setPosition(location)
    } else {
      const marker = new google.maps.Marker({
        position: location,
        map: this.map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7, // Größe des Symbols
          fillColor: 'red', // Farbe des Symbols
          fillOpacity: 1, // Transparenz des Symbols
          strokeWeight: 1 // Dicke des Randes
        },
        label: {
          text: '🧍', // Hier das gewünschte Emoji einfügen
          fontSize: '24px' // Größe des Emoji
        }
      })
      this.curLocMarker = marker
    }
    // Store the marker object in the array
  }

  public sucheNachSushiRestaurants(): void {
    if (!this.isLoading) {
      this.isLoading = true;
      try {
        this.getSushiRestaurants(this.standort);
      } catch (error) {
        alert("A issue occured, please try again.");
        this.isLoading = false;
      }
    }
  }

  public getSushiRestaurants(placeInput: string): void {
    this.recaptchaV3Service.execute('importantAction')
      .subscribe((token) => {
        const sushi = this.fns.httpsCallable('sushi')
        const data = sushi({ placeInput, token })
        data.subscribe((res: { place: any, sushiRestaurants: any[] }) => {
          this.isSearchComplete = true;
          this.isLoading = false;
          this.handleResults(res)
        })
      })
  }

  calculateDistance(point1: google.maps.LatLng, point2: google.maps.LatLng) {
    const radianLat1 = point1.lat() * (Math.PI / 180);
    const radianLat2 = point2.lat() * (Math.PI / 180);
    const deltaLat = radianLat2 - radianLat1;
    const deltaLng = (point2.lng() - point1.lng()) * (Math.PI / 180);
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(radianLat1) * Math.cos(radianLat2) *
      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = 6371000 * c; // Earth's radius in meters
    return distance;
  }

  // Check if the marker is inside the circle
  checkMarkerInsideCircle(marker: google.maps.Marker, circle: google.maps.Circle, circleRadius: number) {
    const markerPosition = marker.getPosition();
    const circleCenter = circle.getCenter();

    if(!markerPosition || !circleCenter) {
      return false;
    }

    const distance = this.calculateDistance(markerPosition, circleCenter);

    if (distance <= circleRadius) {
      return true;
    } else {
      return false;
    }
  }

  addCircleToScore(level: number, circle: google.maps.Circle, radius: number) {
    if(!this.curLocMarker) {
      return;
    }
    const isInside = this.checkMarkerInsideCircle(this.curLocMarker, circle, radius);

    if(isInside) {
      this.totalScore += level;
    }
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((result) => {
        if (result) {
          this.standort = result.coords.latitude + ", " + result.coords.longitude;
          this.sucheNachSushiRestaurants();
        }
      },
        (error: any) => console.log(error));
    }
  }

  share(): void {
    if (!navigator.share) {
      return;
    }

    const shareData = {
      title: 'Sushi Coverage Checker',
      text: 'Check out this cool website! 🤤  I got a sushi 🍣 score of ' + this.totalScore + '/100 😮',
      url: 'https://sushi-coverage-check.web.app/'
    };

    navigator.share(shareData);
  }
}
