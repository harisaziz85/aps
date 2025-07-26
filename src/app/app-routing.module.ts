import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '../app/core/guard/auth.guard'; // Import the AuthGuard

const routes: Routes = [
  { path: '', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  { 
    path: 'pages', 
    loadChildren: () => import('./pages/pages.module').then(m => m.PagesModule),
    canActivate: [authGuard] // Protect the pages route with AuthGuard
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }