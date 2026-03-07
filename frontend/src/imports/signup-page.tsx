Create a responsive **Sign Up page** that matches the existing design system of the project.

Requirements:

* Follow the same layout, colors, typography, spacing, and components used in the current Login page.
* Keep the same split layout:

  * Left side: branding/illustration section (desktop only).
  * Right side: signup form card.

Left Section (Desktop):

* Same dark blue gradient background used in the login page.
* Logo and product name at the top.
* Headline: "Create Your Account".
* Short description about secure examination system.
* Feature list with check icons similar to the login page.

Right Section (Form):

* White card with rounded corners and soft shadow.
* Title: "Sign Up".
* Subtitle: "Create a new account to access the platform".

Form fields:

* Full Name
* Email
* Password
* Confirm Password
* Role selection (Admin, Controller, Moderator, Invigilator) using the same button style as the login page.
* Checkbox: "I agree to the Terms and Privacy Policy".

Actions:

* Primary button: "Create Account".
* Below the form add a text link:
  "Already have an account? Sign In".

States:

* Error message area for validation.
* Loading state on submit button.

Responsive behavior:

* Desktop: two-column layout.
* Mobile: stacked layout with centered form.
* Tablet: maintain spacing and readability.

Use auto-layout and reuse existing components wherever possible.