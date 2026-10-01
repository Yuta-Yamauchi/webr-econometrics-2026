# Run from webr: Rscript tests/verify_energy.R
source("r/energy_plots.R",encoding="UTF-8")
source("r/compare_runs.R",encoding="UTF-8")
code <- readLines("r/02_energy_prediction.R",encoding="UTF-8",warn=FALSE)
run <- function(changes=list()) {
  text <- code
  for (key in names(changes)) text <- sub(paste0("^",key," <- .*"),paste(key,"<-",deparse(changes[[key]])),text)
  env <- new.env(parent=globalenv()); env$.energy_draw <- FALSE
  invisible(capture.output(eval(parse(text=text),env)))
  env$result
}
near <- function(a,b,tol=1e-8) stopifnot(max(abs(a-b))<tol)
base <- run(); warm <- run(list(climate="warm")); cold <- run(list(climate="cold"))
near(energy_metric(base,"population_mean"),122)
near(energy_metric(base,"linear_slope"),0)
near(energy_metric(warm,"linear_slope"),-energy_metric(cold,"linear_slope"))
stopifnot(energy_metric(warm,"linear_slope")>0,
  identical(base$groups$conditional_mean,warm$groups$conditional_mean),
  identical(base$data$epsilon,warm$data$epsilon),all(warm$groups$probability>0))
for (climate in c("balanced","warm","cold")) {
  q <- run(list(climate=climate,degree="2"))
  near(q$groups$projection,q$groups$conditional_mean)
  near(energy_metric(q,"mse_projection"),144)
}
short <- run(list(N=30,climate="warm",degree="2"))
long <- run(list(N=300,climate="warm",degree="2"))
stopifnot(identical(short$data[,c("i","t","y","epsilon")],long$data[1:30,c("i","t","y","epsilon")]))
copy <- run(list(N=300,climate="warm",degree="2"))
stopifnot(identical(long,copy))
# 母集団MSEを数値積分でも検証する。
sigma <- 12; bound <- sqrt(3)*sigma
integrated <- sum(vapply(seq_len(nrow(base$groups)),function(i) {
  m <- base$groups$conditional_mean[i]
  base$groups$probability[i]*integrate(function(e) (m+e-140)^2/(2*bound),-bound,bound)$value
},numeric(1)))
near(integrated,energy_metric(base,"mse_chosen_constant"))
# 表示する図を絞っても，目盛り・保存値・乱数状態を変えない。
pdf(NULL); before <- serialize(list(base,warm),NULL); rng <- .Random.seed
audit <- suppressWarnings(econometrics_compare("prediction",base,warm,views=c("projection","climate")))
dev.off()
stopifnot(identical(unique(audit$axes$view),c("projection","climate")),nrow(audit$axes)==4,
  identical(before,serialize(list(base,warm),NULL)),identical(rng,.Random.seed))
for (view in unique(audit$axes$view)) {
  a <- audit$axes[audit$axes$view==view,3:6]
  stopifnot(identical(unname(unlist(a[1,])),unname(unlist(a[2,]))))
}
dir.create("validation_results/energy",recursive=TRUE,showWarnings=FALSE)
write.csv(long$metrics,"validation_results/energy/ols_300_metrics.csv",row.names=FALSE)
write.csv(short$data,"validation_results/energy/ols_30_data.csv",row.names=FALSE)
write.csv(long$data,"validation_results/energy/ols_300_data.csv",row.names=FALSE)
writeLines(c("Status: passed",paste("Date:",Sys.Date()),R.version.string,
  "Population risks verified by integration; quadratic projection equals CEF; climate symmetry; nested samples; reproducibility; shared axes; no RNG consumption."),
  "validation_results/energy/status.txt")
cat("Energy model checks passed.\n")
