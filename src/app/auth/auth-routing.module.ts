import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ForgetpasswordComponent } from './forgetpassword/forgetpassword.component';
import { PinvarComponent } from './pinvar/pinvar.component';
import { NewpasswordComponent } from './newpassword/newpassword.component';

const routes: Routes = [
  {path:'',component:LoginComponent},
  {path:'forget-password',component:ForgetpasswordComponent},
  {path:'pin-varification',component:PinvarComponent},
  {path:'new-password',component:NewpasswordComponent},



  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
