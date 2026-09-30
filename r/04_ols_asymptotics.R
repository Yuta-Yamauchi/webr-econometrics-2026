# OLSの漸近分布・デルタ法 / OLS asymptotics and delta method
# 経験年数・勤続年数・年間所得の仮想データ。
# SETTINGS_BEGIN
N <- 100L               # N人と4N人の標本を比較する
B <- 500L
rho <- 0.3
beta1 <- 8
beta2 <- 12
sigma <- 40
error_dist <- "exponential"  # "normal" または "exponential"
seed <- 406L
# SETTINGS_END

stopifnot(N > 3, N == as.integer(N), B >= 2, B == as.integer(B),
          all(is.finite(c(rho, beta1, beta2, sigma))), abs(rho) < 1,
          beta2 != 0, sigma > 0, error_dist %in% c("normal", "exponential"))
if (5 * N * B > 5e6) stop("5 × N × B は 5,000,000 以下に設定する。")
set.seed(seed)
beta <- matrix(c(200, beta1, beta2), ncol = 1)

# 1. 母集団の二次モーメントQと漸近分散V
mean_x <- c(1, 20, 5)
Q <- tcrossprod(mean_x)
Q[2:3, 2:3] <- Q[2:3, 2:3] + matrix(c(36, 9*rho, 9*rho, 2.25), 2, 2)
Q_inverse <- solve(Q)
V <- sigma^2 * Q_inverse
h0 <- beta1 / beta2
H <- matrix(c(0, 1/beta2, -beta1/beta2^2), nrow = 1)
delta_variance <- drop(H %*% V %*% t(H))

# 2. 反復ごとにXとuの両方を新しく生成する。
draw_sample <- function(n) {
  v <- runif(n, -sqrt(3), sqrt(3)); w <- runif(n, -sqrt(3), sqrt(3))
  x1 <- 20 + 6*v
  x2 <- 5 + 1.5*(rho*v + sqrt(1-rho^2)*w)
  X <- cbind(1, x1, x2)
  e <- if (error_dist == "normal") rnorm(n) else rexp(n) - 1
  u <- sigma*e
  y <- drop(X %*% beta) + u
  list(X = X, u = u, y = y)
}
estimate <- function(dd) {
  n <- nrow(dd$X)
  bhat <- solve(crossprod(dd$X), crossprod(dd$X, dd$y))
  # (X'X/N)^(-1)をQ^(-1)へ置き換えた一次近似
  influence <- Q_inverse %*% crossprod(dd$X, dd$u) / n
  # h(bhat)の一次近似 h(beta) + H*(bhat-beta)
  h_linear <- h0 + drop(H %*% (bhat - beta))
  c(intercept = bhat[1], beta1 = bhat[2], beta2 = bhat[3],
    standardized = sqrt(n) * (bhat[2] - beta1) / sqrt(V[2, 2]),
    exact_scaled = sqrt(n) * (bhat[2] - beta1),
    influence_scaled = sqrt(n) * influence[2],
    ratio = bhat[2] / bhat[3], ratio_linear = h_linear)
}
sizes <- c(N, 4L*N)
dat <- draw_sample(N)
one <- estimate(dat)
repetitions <- do.call(rbind, lapply(sizes, function(n) {
  values <- t(replicate(B, estimate(draw_sample(n))))
  data.frame(N = n, b = seq_len(B), values)
}))
small <- repetitions[repetitions$N == N, ]
large <- repetitions[repetitions$N == 4*N, ]

blue <- "#005A85"; orange <- "#B45A20"; ink <- "#182632"
par(family = getOption("econometrics.font", "sans"), mar = c(4.5, 4.8, 3, 1.2), mgp = c(2.9, .8, 0),
    col = ink, col.axis = ink, col.lab = ink, fg = ink, las = 1, bty = "l")
breaks <- pretty(range(repetitions$beta1, beta1), n = 35)
hs <- hist(small$beta1, breaks = breaks, plot = FALSE)
hl <- hist(large$beta1, breaks = breaks, plot = FALSE)
plot(hs, freq = FALSE, col = adjustcolor(orange, .45), border = "white",
     ylim = c(0, max(hs$density, hl$density) * 1.3),
     main = "経験年数のOLS係数", xlab = "係数（万円／年）", ylab = "密度")
plot(hl, freq = FALSE, col = adjustcolor(blue, .45), border = "white", add = TRUE)
abline(v = beta1, col = ink, lty = 2, lwd = 2)
legend("topright", c(paste0("N = ", N), paste0("4N = ", 4*N), "生成式の係数"),
       col = c(orange, blue, ink), pch = c(15, 15, NA), pt.cex = 1.4,
       lty = c(NA, NA, 2), lwd = 2, bty = "n", cex = .9)

par(mfrow = c(1, 2), mar = c(4.5, 4.3, 3, .8), cex = .85)
z_limits <- range(repetitions$standardized, -4, 4)
for (n in sizes) {
  zz <- repetitions$standardized[repetitions$N == n]
  xx <- seq(z_limits[1], z_limits[2], length.out = 600)
  hh <- hist(zz, breaks = "FD", plot = FALSE)
  plot(hh, freq = FALSE, col = "#D9E8EF", border = "white", xlim = z_limits,
       ylim = c(0, max(hh$density, dnorm(xx)) * 1.2), main = paste0("N = ", n),
       xlab = "標準化した係数の推定誤差", ylab = "密度")
  lines(xx, dnorm(xx), col = orange, lwd = 2)
  legend("topright", "標準正規密度", col = orange, lty = 1, lwd = 2, bty = "n", cex = .8)
}

for (n in sizes) {
  dd <- repetitions[repetitions$N == n, ]
  lim <- range(dd$influence_scaled, dd$exact_scaled)
  plot(dd$influence_scaled, dd$exact_scaled, pch = 16, col = adjustcolor(blue, .4),
       xlim = lim, ylim = lim, main = paste0("N = ", n),
       xlab = "Qを使った近似（√N倍）", ylab = "OLSの推定誤差（√N倍）")
  abline(0, 1, col = ink, lty = 2, lwd = 2)
}

for (n in sizes) {
  dd <- repetitions[repetitions$N == n, ]
  lim <- range(dd$ratio_linear - h0, dd$ratio - h0)
  plot(dd$ratio_linear - h0, dd$ratio - h0, pch = 16, col = adjustcolor(blue, .4),
       xlim = lim, ylim = lim, main = paste0("N = ", n),
       xlab = "一次近似 H(β̂ − β)", ylab = "係数比の推定誤差")
  abline(0, 1, col = ink, lty = 2, lwd = 2)
}
par(mfrow = c(1, 1), cex = 1)

result <- list(
  settings = data.frame(setting = c("N", "N_large", "B", "rho", "beta1", "beta2", "sigma", "error_dist", "seed"),
                        value = c(N, 4*N, B, rho, beta1, beta2, sigma, error_dist, seed)),
  model = c("x1=20+6*v; x2=5+1.5*(rho*v+sqrt(1-rho^2)*w); independent standardized uniforms v,w",
            "y=X*beta+u; X and u are redrawn for each replication; E[u|X]=0; Var(u|X)=sigma^2 I",
            "Q=E[x_i' x_i]; V=sigma^2 Q^(-1); h(beta)=beta1/beta2; H=(0,1/beta2,-beta1/beta2^2)"),
  metrics = data.frame(
    key = c("estimate1", "ratio_target", "ratio_observed", "theory_sd_small", "sd_small", "theory_sd_large", "sd_large",
            "delta_sd_small", "delta_sd_large", "influence_rmse_small", "influence_rmse_large", "delta_median_error_small", "delta_median_error_large"),
    label = c("今回の経験年数係数", "生成式の係数比 β₁/β₂", "今回のOLS係数比", "N人の係数の漸近標準偏差", "N人の係数の反復標準偏差",
              "4N人の係数の漸近標準偏差", "4N人の係数の反復標準偏差", "N人の係数比のデルタ法標準偏差", "4N人の係数比のデルタ法標準偏差",
              "N人の√N倍のOLS・一次近似のRMSE", "4N人の√N倍のOLS・一次近似のRMSE",
              "N人の係数比・一次近似の絶対差の中央値", "4N人の係数比・一次近似の絶対差の中央値"),
    value = c(one["beta1"], h0, one["ratio"], sqrt(V[2, 2]/N), sd(small$beta1), sqrt(V[2, 2]/(4*N)), sd(large$beta1),
              sqrt(delta_variance/N), sqrt(delta_variance/(4*N)),
              sqrt(mean((small$exact_scaled - small$influence_scaled)^2)), sqrt(mean((large$exact_scaled - large$influence_scaled)^2)),
              median(abs(small$ratio - small$ratio_linear)), median(abs(large$ratio - large$ratio_linear)))),
  data = data.frame(i = seq_len(N), x1 = dat$X[, 2], x2 = dat$X[, 3], y = dat$y, u = dat$u),
  repetitions = repetitions,
  plot_titles = c("調査人数別の経験年数係数の分布", "経験年数係数の推定誤差を標準化した分布", "OLSの推定誤差と一次近似", "係数比の推定誤差と一次近似"),
  plot_notes = c(
    sprintf("%d人の調査を橙，%d人の調査を青で示す。調査を各%d回繰り返し，各回で推定した経験年数の係数を棒で集計している。黒い縦の破線は生成式の係数。縦軸は密度で，棒の面積が各区間の割合を表す。", N, 4*N, B),
    sprintf("左は%d人，右は%d人の調査を各%d回繰り返した結果。青い棒は経験年数係数の推定値から設定値を引き，漸近理論の標準偏差で割った値の分布。橙の曲線は平均0・分散1の標準正規分布。縦軸は密度で，棒の面積が各区間の割合を表す。", N, 4*N, B),
    sprintf("左は%d人，右は%d人の調査。点1つが1回の調査で，各図に%d点ある。横軸は母集団の二次モーメントQを使った一次近似，縦軸は経験年数係数の実際の推定誤差。両軸とも各調査の人数の平方根をかけた値。破線は両者が等しい位置。", N, 4*N, B),
    sprintf("係数比は経験年数の係数を勤続年数の係数で割った値。左は%d人，右は%d人の調査で，各図に%d回の結果を示す。点1つが1回の調査。横軸はデルタ法による一次近似，縦軸は推定した係数比から生成式の係数比を引いた値。破線は両者が等しい位置。", N, 4*N, B)))
print(result$metrics[, c("label", "value")], row.names = FALSE)
invisible(result)
