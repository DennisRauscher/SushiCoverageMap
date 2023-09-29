import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { FormsModule } from '@angular/forms'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { initializeApp, provideFirebaseApp } from '@angular/fire/app'
import { environment } from '../environments/environment'
import { provideFunctions, getFunctions } from '@angular/fire/functions'
import { FIREBASE_OPTIONS } from '@angular/fire/compat'
import { RECAPTCHA_V3_SITE_KEY, ReCaptchaV3Service, RecaptchaV3Module } from 'ng-recaptcha'
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faShareNodes } from '@fortawesome/free-solid-svg-icons';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    RecaptchaV3Module,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFunctions(() => getFunctions()),
    FontAwesomeModule,
  ],
  providers: [
    ReCaptchaV3Service,
    { provide: FIREBASE_OPTIONS, useValue: environment.firebase },
    { provide: RECAPTCHA_V3_SITE_KEY, useValue: environment.recaptcha_key }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faShareNodes);
  }
}
