<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>



<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/ashcastelinocs124/gitglow">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">GitGlow</h3>

  <p align="center">
    Turn your GitHub presence into a narrative portfolio with visual assets
    <br />
    <a href="https://github.com/ashcastelinocs124/gitglow"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/ashcastelinocs124/gitglow">View Demo</a>
    &middot;
    <a href="https://github.com/ashcastelinocs124/gitglow/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/ashcastelinocs124/gitglow/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

GitGlow is a GitHub profile README generator that analyzes your GitHub activity and transforms it into a polished, narrative-driven portfolio. Instead of manually crafting your profile README, GitGlow automatically generates:

* **Animated SVG cards** — activity heatmaps, language breakdowns, growth timelines, and journey visualizations
* **AI-powered narrative** — GPT-4o analyzes your repos, contributions, and coding patterns to write a personalized developer story
* **One-click publishing** — connect your GitHub account, answer a few questions, preview your README, and publish directly

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![Next][Next.js]][Next-url]
* [![React][React.js]][React-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these steps.

### Prerequisites

* Node.js 18+
* npm
  ```sh
  npm install npm@latest -g
  ```
* PostgreSQL database
* GitHub OAuth app credentials
* OpenAI API key (for AI-powered analysis)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/ashcastelinocs124/gitglow.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Copy the environment template and fill in your credentials
   ```sh
   cp .env.example .env.local
   ```
4. Set up your environment variables in `.env.local`
   ```env
   GITHUB_ID=your_github_oauth_app_id
   GITHUB_SECRET=your_github_oauth_app_secret
   NEXTAUTH_SECRET=your_nextauth_secret
   OPENAI_API_KEY=your_openai_api_key
   DATABASE_URL=your_postgresql_connection_string
   ```
5. Run database migrations
   ```sh
   npx prisma migrate dev
   ```
6. Start the development server
   ```sh
   npm run dev
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

1. **Connect GitHub** — Sign in with your GitHub account
2. **Answer questions** — Tell GitGlow about your developer identity (archetype, interests, goals)
3. **Select featured projects** — Choose which repositories to highlight
4. **Preview & edit** — Review your generated README with embedded visual assets
5. **Publish** — Push the README directly to your GitHub profile repository

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [x] GitHub OAuth integration
- [x] Onboarding questionnaire
- [x] SVG asset generation (activity, language, timeline, growth cards)
- [x] AI-powered profile analysis with GPT-4o
- [x] README composition with narrative sections
- [ ] Cloud storage for assets
- [ ] Real database integration (currently in-memory store)
- [ ] Direct GitHub publishing via API
- [ ] Additional README themes/templates
- [ ] Custom SVG card themes

See the [open issues](https://github.com/ashcastelinocs124/gitglow/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Top contributors:

<a href="https://github.com/ashcastelinocs124/gitglow/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ashcastelinocs124/gitglow" alt="contrib.rocks image" />
</a>



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

ashcastelino - [@ashcastelinocs124](https://github.com/ashcastelinocs124)

Project Link: [https://github.com/ashcastelinocs124/gitglow](https://github.com/ashcastelinocs124/gitglow)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)
* [Img Shields](https://shields.io)
* [Next.js](https://nextjs.org)
* [Tailwind CSS](https://tailwindcss.com)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/ashcastelinocs124/gitglow.svg?style=for-the-badge
[contributors-url]: https://github.com/ashcastelinocs124/gitglow/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/ashcastelinocs124/gitglow.svg?style=for-the-badge
[forks-url]: https://github.com/ashcastelinocs124/gitglow/network/members
[stars-shield]: https://img.shields.io/github/stars/ashcastelinocs124/gitglow.svg?style=for-the-badge
[stars-url]: https://github.com/ashcastelinocs124/gitglow/stargazers
[issues-shield]: https://img.shields.io/github/issues/ashcastelinocs124/gitglow.svg?style=for-the-badge
[issues-url]: https://github.com/ashcastelinocs124/gitglow/issues
[license-shield]: https://img.shields.io/github/license/ashcastelinocs124/gitglow.svg?style=for-the-badge
[license-url]: https://github.com/ashcastelinocs124/gitglow/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/ashcastelino
[product-screenshot]: images/screenshot.png
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
