# Omniglot

## Check Out the App!

![App Logo](./public/images/logo.png)

## Description

My project is a web application dedicated to language enthusiasts, where users can find language exchange partners to learn with (similar to Tandem), but also includes the option to offer paid classes and other services for certified teachers.

## User Stories

- **404** - As a user, I want to see an appealing 404 page when I navigate to a non-existent page, so I understand it's my mistake.
- **500** - As a user, I want to see a friendly error page when the team makes a mistake, so I know it's not my fault.
- **homepage** - As a user, I want to access the homepage to understand what the app offers and to log in or sign up.
- **sign up** - As a user, I want to register on the website so I can view all the events available to attend.
- **login** - As a user, I want to log in to the website so I can access my account.
- **logout** - As a user, I want to log out from the website to ensure my account's security.
- **events list** - As a user, I want to view all available events so I can choose which ones to attend.
- **events create** - As a user, I want to create an event so I can invite others to join.
- **offers** - As a user, I want to offer private or group classes, online or in-person, setting my own availability and prices to make my offers attractive and competitive.
- **calendar** - As a user, I want to easily track, manage, or reschedule my classes using a dynamic calendar.
- **reviews** - As a student, I want to rate my teacher after the class and share my experience.
- **live messages** - As a user, I want to keep in touch with my students at any time.

## Future Enhancements

- **Live Video** - Integrate live video functionality like Zoom and offer public/private video sessions for teaching, similar to Udemy.
- **Online Exercises** - Allow teachers to create online exercises for students to complete.

## Technologies Utilized

- HTML
- CSS
- JavaScript
- Node.js
- Express
- Handlebars
- Sessions & Cookies
- MongoDB & Mongoose

## Packages

- bcrypt
- multer, cloudinary
- fullcalendar
- socket.io
- stripe

## Database Models

### User Model

- **username**: String
- **email**: String (unique, required)
- **password**: String (required)
- **gender**: String
- **birthdate**: String (required)
- **country**: String (required)
- **profilePic**: String
- **lang_teach**: [String] (default: [])
- **lang_learn**: [String] (default: [])
- **private**: Boolean
- **professional**: Boolean
- **stripeAccountId**: String
- **chats**: [ObjectId<Chat>]
- **offers**: [ObjectId<Offer>]

### Chat Model

- **participants**: [ObjectId<User>]
- **messages**: [ObjectId<Message>]
- **lastMessageTimestamp**: Date (default: null)

### Booking Model

- **student**: ObjectId<User> (required)
- **teacher**: ObjectId<User> (required)
- **date**: String (required)
- **timeslot**: String (required)
- **language**: String (required)
- **level**: String (required)
- **classType**: String (required)
- **maxGroupSize**: Number
- **locationType**: String (required)
- **location**: String
- **duration**: Number (required)
- **isRated**: Boolean (default: false)
- **reschedule**:
  - **new_date**: String
  - **new_timeslot**: String
  - **status**: String
  - **initiator**: String

### Flashcard Deck Model

- **creator**: ObjectId<User> (required)
- **cards**: [ObjectId<Flashcard>]
- **language**: String (required)
- **level**: String (required)
- **topic**: String (required)

### Flashcard Model

- **front**: String (required)
- **back**: String (required)
- **priority**: Number (default: 0)

### Message Model

- **sender**: ObjectId<User>
- **recipient**: ObjectId<User>
- **message**: String
- **timestamp**: Date (default: Date.now)

### Notification Model

- **source**: ObjectId<User>
- **target**: ObjectId<User>
- **type**: String
- **read**: Boolean (default: false)
- **createdAt**: Date (default: Date.now)

### Offer Model

- **name**: String (required)
- **language**: String (required)
- **level**: String (required)
- **locationType**: String (required)
- **location**: String
- **duration**: Number (required)
- **classType**: String (required)
- **maxGroupSize**: Number (default: 2)
- **price**: Number (required)
- **timeslots**: [String] (required)
- **weekdays**: [String] (required)

### Rating Model

- **author**: ObjectId<User> (required)
- **subject**: ObjectId<User> (required)
- **rating**: Number (required)
- **text**: String (required)
- **date**: String (required)
- **language**: String (required)
- **level**: String (required)
- **classType**: String (required)
- **locationType**: String (required)


## Useful Links

- **Repository**: [Repository Link](https://github.com/AmVa93n/Omniglot)
- **Deployment**: [Deployment Link](https://omniglot-znxc.onrender.com/)

## Contributors

- Developer 1: [Amir Vaknin](https://github.com/AmVa93n)
- Developer 2: [Tiago Laibaças](https://gist.github.com/MistaKitty)

## Presentation Slides

- [Link to the slides](URL to slides)
