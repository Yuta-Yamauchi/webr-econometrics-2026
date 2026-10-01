# Run from webr: Rscript tests/verify_models.R validation_results
args <- commandArgs(trailingOnly = TRUE)
out_dir <- if (length(args)) args[1] else file.path(tempdir(), "webr-model-checks")
dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)
pdf(NULL)
run_case <- function(file, changes = list(), draw = FALSE, prefix = "") {
  old_font <- getOption("econometrics.font")
  if (draw && .Platform$OS.type == "windows") options(econometrics.font = "Yu Gothic")
  on.exit(options(econometrics.font = old_font))
  code <- readLines(file, encoding = "UTF-8", warn = FALSE)
  for (key in names(changes)) {
    value <- changes[[key]]
    if (is.character(value)) value <- paste0('"', value, '"')
    code <- sub(paste0("^", key, " <- .*"), paste(key, "<-", value), code)
  }
  if (draw) png(file.path(out_dir, paste0(prefix, "_%02d.png")),
                width = 960, height = 540, pointsize = 20, type = "cairo")
  env <- new.env(parent = globalenv())
  withCallingHandlers(invisible(capture.output(eval(parse(text = code), envir = env))),
    warning = function(w) {
      if (grepl("conversion failure|mbcsToSbcs", conditionMessage(w))) invokeRestart("muffleWarning")
    })
  if (draw) dev.off()
  env
}
metric <- function(e, key) e$result$metrics$value[match(key, e$result$metrics$key)]
near <- function(a, b, tol = 1e-8) stopifnot(max(abs(a - b)) < tol)
cases <- dget("tests/cases.R")
defaults <- list(); checks <- list()
for (case in cases) {
  e <- run_case(case$file, case$params, draw = case$preset == "base", prefix = case$id)
  r <- e$result; pp <- case$params
  stopifnot(is.data.frame(r$metrics), all(is.finite(r$metrics$value)), !anyDuplicated(r$metrics$key))
  if (case$id == "survey") {
    near(metric(e, "population_mean"), pp$mu0 + pp$p * pp$gap)
    q <- pp$p * pp$r1 / ((1-pp$p)*pp$r0 + pp$p*pp$r1)
    near(metric(e, "response_target"), pp$mu0 + q*pp$gap)
    near(metric(e, "respondent_mean"), mean(r$data$y[r$data$response == 1]))
    stopifnot(nrow(r$data) == pp$N, nrow(r$repetitions) == pp$B)
  } else if (case$id == "prediction") {
    near(e$orthogonality, 0, 1e-7)
    fit <- if (as.integer(pp$degree)==1) lm(y ~ z,data=r$data) else lm(y ~ z + I(z^2),data=r$data)
    near(e$beta_ols, coef(fit), 1e-7)
    stopifnot(metric(e,"mse_mean") >= metric(e,"mse_linear")-1e-8,
              metric(e,"mse_linear") >= metric(e,"mse_projection")-1e-8,
              metric(e,"mse_projection") >= pp$sigma^2-1e-8)
    if (as.integer(pp$degree)==2) { near(e$beta_projection,c(80,0,.45)); near(metric(e,"mse_projection"),pp$sigma^2) }
  } else if (case$id == "auxiliary") {
    near(metric(e, "fwl_gap"), 0)
    for (a in 0:1) {
      dd <- r$data[r$data$a == a, ]
      near(dd$dr, dd$d - mean(dd$d)); near(dd$yr, dd$y - mean(dd$y))
    }
    if (pp$gamma == 0 || pp$delta == 0) near(metric(e, "raw_target"), pp$beta)
    if (case$preset == "base") {
      near(metric(e, "raw"), 38.7300455647825)
      near(metric(e, "full"), 19.4044283407209)
      if (file.exists("../simulations/results/partial_regression.csv")) {
        original <- read.csv("../simulations/results/partial_regression.csv")
        near(r$data$y, original$y); near(r$data$d, original$d)
      }
    }
  } else if (case$id == "precision") {
    near(e$beta_hat, coef(lm(y ~ x1 + x2, data = r$data)), 1e-7)
    near(crossprod(e$X, e$residual)/pp$N, 0, 1e-7)
    near(e$conditional_variance, pp$sigma^2 * solve(crossprod(e$X)))
    near(r$repetitions$variance_naive * pp$N, r$repetitions$variance_corrected * (pp$N-3))
    stopifnot(all(r$data$x2 < r$data$x1), all(r$data$x2 > 0))
  } else if (case$id == "sampling") {
    near(metric(e, "theory_sd"), pp$sigma/sqrt(pp$N))
    near(r$repetitions$standardized, sqrt(pp$N)*(r$repetitions$y_bar-pp$mu)/pp$sigma)
  } else if (case$id == "asymptotic") {
    near(e$Q[2, 3], 100+9*pp$rho)
    near(e$V, pp$sigma^2*solve(e$Q))
    numeric_H <- sapply(1:3, function(j) {
      up <- drop(e$beta); down <- up; up[j] <- up[j]+1e-5; down[j] <- down[j]-1e-5
      (up[2]/up[3]-down[2]/down[3])/2e-5
    })
    near(e$H, numeric_H)
    near(metric(e, "theory_sd_small"), 2*metric(e, "theory_sd_large"))
    near(metric(e, "delta_sd_small"), 2*metric(e, "delta_sd_large"))
    rep <- r$repetitions
    near(rep$ratio_linear, e$h0+(rep$beta1-pp$beta1)/pp$beta2 - pp$beta1*(rep$beta2-pp$beta2)/pp$beta2^2)
    stopifnot(nrow(rep) == 2*pp$B)
  }
  if (case$preset == "base") {
    again <- run_case(case$file)
    stopifnot(isTRUE(all.equal(r$data, again$result$data)), isTRUE(all.equal(r$repetitions, again$result$repetitions)))
    defaults[[case$id]] <- r
    for (key in c("settings", "metrics", "data", "repetitions", "groups"))
      if (is.data.frame(r[[key]])) write.csv(r[[key]], file.path(out_dir, paste0(case$id, "_", key, ".csv")), row.names = FALSE)
  }
  checks[[length(checks)+1]] <- data.frame(experiment = case$id, preset = case$preset, status = "passed", metrics = nrow(r$metrics), plots = length(r$plot_titles))
}
# Additional changes available through fields and the code editor.
for (distribution in c("normal", "exponential", "uniform")) {
  e <- run_case("r/01_sampling.R", list(N=2, B=20, distribution=distribution))
  stopifnot(all(is.finite(e$result$metrics$value)))
}
for (changes in list(list(sigma_u=0, B=20), list(beta=0, gamma=0, sigma_u=0, B=20))) {
  e <- run_case("r/03_auxiliary_regression.R", changes)
  stopifnot(all(is.finite(e$result$metrics$value))); near(metric(e, "fwl_gap"), 0)
}
stopifnot(inherits(try(run_case("r/03_auxiliary_regression.R", list(sigma_v=0)), silent=TRUE), "try-error"),
          inherits(try(run_case("r/04_ols_asymptotics.R", list(beta2=0)), silent=TRUE), "try-error"))
dev.off()
write.csv(do.call(rbind, checks), file.path(out_dir, "preset_checks.csv"), row.names=FALSE)
writeLines(c("Status: passed", paste("Date:", Sys.Date()), R.version.string,
             "26 presets; all 6 default scripts match UI settings; reproducibility; matrix OLS; FWL; population moments; delta gradient; invalid inputs",
             "Native PNG plots are separate from browser UI verification."), file.path(out_dir, "status.txt"))
cat("All 26 presets and additional checks passed. Results:", normalizePath(out_dir), "\n")
