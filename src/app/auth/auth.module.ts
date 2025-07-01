import { NgModule,  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { ForgetpasswordComponent } from './forgetpassword/forgetpassword.component';
import { PinvarComponent } from './pinvar/pinvar.component';
import { NewpasswordComponent } from './newpassword/newpassword.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
 
  ],
  imports: [
    LoginComponent,
    ForgetpasswordComponent,
    PinvarComponent,
    NewpasswordComponent,

    CommonModule,
    AuthRoutingModule,
    FontAwesomeModule,
    FormsModule

  ]
})
export class AuthModule { }
