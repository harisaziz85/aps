import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProjectbuildingComponent } from './projectbuilding/projectbuilding.component';
import { CreateprojectComponent } from './createproject/createproject.component';
import { PresentationComponent } from './presentation/presentation.component';
import { CoverletterComponent } from './coverletter/coverletter.component';
import { ClientsComponent } from './clients/clients.component';
import { AllUsersComponent } from './allusers/allusers.component';
import { ProductsComponent } from './products/products.component';
import { ApprovaldocumentsComponent } from './approvaldocuments/approvaldocuments.component';
import { ArchiveProjectComponent } from './archiveprojects/archiveprojects.component';
import { UpdateStep1Component } from './update-step1/update-step1.component';
import { UpdateStep2Component } from './update-step2/update-step2.component';
import { UpdateStep3Component } from './update-step3/update-step3.component';
import { UpdateStep4Component } from './update-step4/update-step4.component';
import { UpdateStep5Component } from './update-step5/update-step5.component';


const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent, data: { title: 'Dashboard' } },
  { path: 'project-building', component: ProjectbuildingComponent, data: { title: 'Projects and Buildings' } },
  { path: 'create-project', component: CreateprojectComponent, data: { title: 'Create Project' } },
 { path: 'presentation/:projectId', component: PresentationComponent, data: { title: 'Project Presentation' } },
  { path: 'coverletter', component: CoverletterComponent, data: { title: 'Cover Letter' } },
  { path: 'clients', component: ClientsComponent, data: { title: 'Clients' } },
  { path: 'all-users', component: AllUsersComponent, data: { title: 'All Users' } },
  { path: 'products', component: ProductsComponent, data: { title: 'Products' } },
  { path: 'approval-documents', component: ApprovaldocumentsComponent, data: { title: 'Approval Documents' } },
{ path: 'updateproject/:id', component: UpdateStep1Component, data: { title: 'Update Project' } },
{ path: 'updateproject2/:id', component: UpdateStep2Component, data: { title: 'Update Project' } },
{ path: 'updateproject3/:id', component: UpdateStep3Component, data: { title: 'Update Project' } },
{ path: 'updateproject4/:id', component: UpdateStep4Component, data: { title: 'Update Project' } },

{ path: 'updateproject5/:id', component: UpdateStep5Component, data: { title: 'Update Project' } },



  { path: 'archive-projects', component: ArchiveProjectComponent, data: { title: 'Archive Projects' } },
  { path: '**', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }