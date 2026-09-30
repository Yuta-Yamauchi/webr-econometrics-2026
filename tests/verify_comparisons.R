# Run from webr: Rscript tests/verify_comparisons.R validation_results/comparisons
args <- commandArgs(trailingOnly = TRUE)
out <- if (length(args)) args[1] else file.path(tempdir(), "webr-comparisons")
dir.create(out, recursive = TRUE, showWarnings = FALSE)
source("r/compare_runs.R", encoding = "UTF-8")
cases <- dget("tests/cases.R")
defaults <- Filter(function(x) x$preset == "base", cases)
changes <- list(survey = list(r1 = .2), prediction = list(curvature = 0), auxiliary = list(gamma = 0),
                precision = list(rho = .95), sampling = list(N = 100), asymptotic = list(beta2 = 3))
views <- list(survey = c("composition", "means"), prediction = c("prediction", "mse", "projection_error"),
  auxiliary = c("raw", "centered", "coefficients"), precision = c("predictors", "beta1", "beta2", "variance"),
  sampling = c("sample", "means", "standardized"), asymptotic = c("coefficients", "standardized", "influence", "ratio"))
run_case <- function(case, updates = list()) {
  old_font <- getOption("econometrics.font")
  options(econometrics.font = "sans")
  on.exit(options(econometrics.font = old_font))
  code <- readLines(case$file, encoding = "UTF-8", warn = FALSE)
  for (key in names(updates)) code <- sub(paste0("^", key, " <- .*"), paste(key, "<-", deparse(updates[[key]])), code)
  e <- new.env(parent = globalenv())
  withCallingHandlers(invisible(capture.output(eval(parse(text = code), e))),
    warning = function(w) if (grepl("conversion failure|mbcsToSbcs", conditionMessage(w))) invokeRestart("muffleWarning"))
  e$result
}
pdf(NULL)
checks <- list()
for (case in defaults) {
  reference <- run_case(case)
  current <- run_case(case, changes[[case$id]])
  before <- serialize(list(reference, current), NULL)
  rng <- .Random.seed
  if (.Platform$OS.type == "windows") options(econometrics.font = "Yu Gothic")
  png(file.path(out, paste0(case$id, "_%02d.png")), width = 720, height = 700, pointsize = 30, type = "cairo")
  audit <- econometrics_compare(case$id, reference, current)
  dev.off()
  stopifnot(identical(rng, .Random.seed), identical(before, serialize(list(reference, current), NULL)),
            identical(unique(audit$axes$view), views[[case$id]]), nrow(audit$axes) == length(views[[case$id]]) * 2L)
  for (view in views[[case$id]]) {
    aa <- audit$axes[audit$axes$view == view, 3:6]
    stopifnot(identical(unname(unlist(aa[1, ])), unname(unlist(aa[2, ]))), all(is.finite(unlist(aa))))
  }
  for (breaks in audit$breaks) stopifnot(length(breaks) > 2, all(diff(breaks) > 0))
  write.csv(audit$axes, file.path(out, paste0(case$id, "_axes.csv")), row.names = FALSE)
  saveRDS(audit$breaks, file.path(out, paste0(case$id, "_breaks.rds")))
  write.csv(reference$metrics, file.path(out, paste0(case$id, "_reference_metrics.csv")), row.names = FALSE)
  write.csv(current$metrics, file.path(out, paste0(case$id, "_current_metrics.csv")), row.names = FALSE)
  checks[[case$id]] <- data.frame(lesson = case$id, views = length(views[[case$id]]), status = "passed")
}
# Zero-variance coefficients still require valid shared histogram intervals.
case <- defaults[[which(vapply(defaults, function(x) x$id == "auxiliary", logical(1)))]]
flat <- run_case(case, list(beta = 0, gamma = 0, sigma_u = 0, B = 20))
png(file.path(out, "constant_%02d.png"), width = 720, height = 700, pointsize = 30, type = "cairo")
invisible(econometrics_compare("auxiliary", flat, flat))
dev.off()
dev.off()
write.csv(do.call(rbind, checks), file.path(out, "checks.csv"), row.names = FALSE)
cat("Passed: six baseline/changed comparisons; identical paired axes; no RNG consumption or input mutation; constant coefficients.\n")
