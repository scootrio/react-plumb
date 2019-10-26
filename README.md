# react-plumb
React integration for the popular jsPlumb connection library

## Contributing
Follow the below guidelines when contributing to this project.

### Commit Messages
A simplified version of [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0-beta.4/)

```
<type>: <description>

[body]

[footer]
```

With the following available structural elements:

- **Type**: the type of the commit
    - `feat`: a new feature (minor semantic version)
    - `fix`: a bug fix (patch semantic version)
    - `refactor`: code change that represents an architectural or design change that does not add a feature or fix a bug
    - `perf`: code change that improves the performance without adding a new feature or fixing a bug
    - `test`: adding, correcting, or enhancing tests
    - `build`: change that affects the build system or external dependencies (library updates, etc.)
    - `devops`: change that improves the development operation of the project (e.g. adding `husky` to provide easy Git
       hooks or changing CI/CD configuration files)
    - `chore`; change that keeps code clean, such as removing forgotten, dead dependencies and code
    - `style`: changes (such as whitespace) that do not affect the meaning of the code
    - `docs`: documentation only changes
- **Body**: additional details about the commit (if needed)
- **Footer**: information about breaking changes (major semantic version), referenced issues
    - If breaking changes are present in the commit, the footer MUST begin with `BREAKING CHANGE: <details>`, where
      `<details>` explains the breaking change and potentially how to upgrade from the old version to the new.

Do not create a commit that does not contain changes that can fit into more than one category above. Likewise, do not create a commit unless the commit itself represents a single, complete unit that fits inside one of the categories above. If, for example, a feature branch consists of multiple commits for the same feature, squash the messages when merging into master, providing the correct commit message at that time.

## Change Log
Change logs are meant to be human readable, and therefore this project's change log follows the principles outlined on [keepachangelog.com](https://keepachangelog.com/en/1.0.0/). Changes can be collected by referencing the Git commit logs according to the format described above. In summary, there are only six kinds of changes tracked in the change log:
- `Added`: new features
- `Changed`: existing feature updates/improvements
- `Deprecated`: notice of features no longer receiving support that will soon be removed
- `Removed`: features that have been removed
- `Fixed`: bug fixes
- `Security`: vulnerability patches
