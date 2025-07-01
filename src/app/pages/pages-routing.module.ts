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
  { path: 'archive-projects', component: ArchiveProjectComponent, data: { title: 'Archive Projects' } },
  { path: '**', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }