module.exports = {
    extends: ["@commitlint/config-conventional"],
    rules: {
        "type-enum": [
            2,
            "always",
            [
                "feature", // new feature
                "tech", // technical backlog
                "submodule", // submodule update for onboarding
                "bugfix", // bug fix 
                "hotfix", // hot fix
                "docs", // documentation
                "format", // format
                "refactor", // refactor
                "test", // unit test
                "perf", // improve performance
                "chore", // build process 
                "revert", // revert
                "merge", // merge code
                "ci", // continuous integration and deployment
            ],
        ],
        "type-case": [0],
        "type-empty": [0],
        "scope-empty": [0],
        "scope-case": [0],
        "subject-full-stop": [0, "never"],
        "subject-case": [0, "never"],
        "header-max-length": [0, "always", 72],
    },
};
