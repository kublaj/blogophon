Contributing
============

Getting started
---------------

You will need:

1. A [Github account](https://github.com/) and Git
2. [NodeJs](https://nodejs.org/) with NPM installed
3. [Gulp](https://gulpjs.com/) installed globally
4. [ESLint](https://eslint.org/) installed globally
5. [Nodeunit](https://github.com/caolan/nodeunit) installed globally

For Gulp, ESLint and Nodeunit call `npm install -g gulp-cli eslint nodeunit` from command line.

Making changes
--------------

1. [Fork the repository on GitHub](https://help.github.com/articles/fork-a-repo/)
2. Checkout your new repository and run `npm install`.
3. Create a new feature branch from `master` branch, like `feature/my-cool-feature`.
4. Start the Gulp watcher via `gulp watch` and start developing. Coding guidelines will be enforced by Gulp. And if you are really nice you will supply a test for stuff you coded.
5. Commit with a meaningful commit message & push to your repository.
6. Run `npm test`. Be sure that all tests pass before proceeding any further.
7. [Submit a pull request](https://help.github.com/articles/about-pull-requests/).

Further reading
---------------

* [docs/development.md](Theming development guide)
