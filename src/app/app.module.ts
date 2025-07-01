import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { authInterceptor } from './core/interceptor/auth.interceptor';
import { SvgIconComponent } from './SVGS/shared/svg-icon/svg-icon.component';
import { SafeHtmlPipe } from './SVGS/shared/safe-html.pipe';
import { SvgIconsComponent } from './SVGS/shared/svg-icons/svg-icons.component';

@NgModule({
  declarations: [
    AppComponent,
    SvgIconComponent,
    SafeHtmlPipe,
    SvgIconsComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    CommonModule,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    provideHttpClient(withInterceptors([authInterceptor]))
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }