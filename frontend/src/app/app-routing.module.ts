import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Auth Components
import { LoginComponent } from './auth/components/login/login.component';
import { RegisterComponent } from './auth/components/register/register.component';
import { ForgotPasswordComponent } from './auth/components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/components/reset-password/reset-password.component';

// Core Components
import { PageNotFoundComponent } from './core/components/page-not-found/page-not-found.component';

// Guards
import { AuthGuard } from './core/guards/auth.guard';
import { TenantGuard } from './core/guards/tenant.guard';

const routes: Routes = [
  // Auth routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password/:token', component: ResetPasswordComponent },
  
  // Main application routes (lazy loaded)
  {
    path: '',
    canActivate: [AuthGuard, TenantGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'contracts',
        loadChildren: () => import('./features/contracts/contracts.module').then(m => m.ContractsModule)
      },
      {
        path: 'documents',
        loadChildren: () => import('./features/documents/documents.module').then(m => m.DocumentsModule)
      },
      {
        path: 'clients',
        loadChildren: () => import('./features/clients/clients.module').then(m => m.ClientsModule)
      },
      {
        path: 'tasks',
        loadChildren: () => import('./features/tasks/tasks.module').then(m => m.TasksModule)
      },
      {
        path: 'consultations',
        loadChildren: () => import('./features/consultations/consultations.module').then(m => m.ConsultationsModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  // Wildcard route for 404
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
