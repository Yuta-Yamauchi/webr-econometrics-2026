# 所得調査・母集団と標本 / Income survey, population and sample
# 仮想データ。設定値は実際の調査の推定値ではない。
# SETTINGS_BEGIN
N <- 300L               # 調査へ招待する人数
B <- 500L               # 独立な調査を繰り返す回数
p <- 0.4                # 母集団の地域Bの比率
mu0 <- 300              # 地域Aの平均所得（万円）
gap <- 120              # 地域BとAの平均所得差（万円）
sigma <- 100            # 地域内の所得の標準偏差（万円）
r0 <- 0.6               # 地域Aの回答確率
r1 <- 0.6               # 地域Bの回答確率
seed <- 101L
# SETTINGS_END

stopifnot(N >= 2, N == as.integer(N), B >= 2, B == as.integer(B),
          all(is.finite(c(p, mu0, gap, sigma, r0, r1))),
          p > 0, p < 1, sigma > 0, r0 > 0, r0 <= 1, r1 > 0, r1 <= 1)
if (N * B > 5e6) stop("N × B は 5,000,000 以下に設定する。")
set.seed(seed)

# 1. 母集団から招待者を抽出し，各人の回答を抽選する。
draw_sample <- function() {
  a <- rbinom(N, 1, p)
  u <- sigma * (rexp(N) - 1)
  y <- mu0 + gap * a + u
  response <- rbinom(N, 1, ifelse(a == 0, r0, r1))
  data.frame(i = seq_len(N), a = a, u = u, y = y, response = response)
}
dat <- draw_sample()
respondents <- dat[dat$response == 1, ]
if (!nrow(respondents)) stop("今回の標本には回答者がいない。乱数シードまたは招待者数を変更する。")

# 2. 確率モデルが定める二つの平均
population_mean <- mu0 + p * gap
response_rate <- (1 - p) * r0 + p * r1
response_share <- p * r1 / response_rate
response_target <- mu0 + response_share * gap

# 3. 回答者が0人の反復では回答者平均をNAとして保存する。
repeated <- t(replicate(B, {
  dd <- draw_sample(); rr <- dd$response == 1
  c(invited_mean = mean(dd$y),
    respondent_mean = if (any(rr)) mean(dd$y[rr]) else NA_real_,
    respondents = sum(rr))
}))
valid <- is.finite(repeated[, "respondent_mean"])
if (sum(valid) < 2) stop("回答者平均が得られた反復が2回未満である。招待者数または回答確率を増やす。")

blue <- "#005A85"; orange <- "#B45A20"; ink <- "#182632"
par(family = getOption("econometrics.font", "sans"), mar = c(5.5, 6, 3, 1.2), mgp = c(3.8, .8, 0),
    col = ink, col.axis = ink, col.lab = ink, fg = ink, las = 1, bty = "l")
shares <- c(p, mean(dat$a), mean(respondents$a))
barplot(rbind(1 - shares, shares), col = c(blue, orange), border = NA,
        names.arg = c("母集団", "今回の招待者", "今回の回答者"), ylim = c(0, 1.25),
        ylab = "構成比", main = "地域A・地域Bの構成比")
legend("top", c("地域A", "地域B"), fill = c(blue, orange), bty = "n", horiz = TRUE)

breaks <- pretty(range(dat$y), n = 25)
hi <- hist(dat$y, breaks = breaks, plot = FALSE)
hr <- hist(respondents$y, breaks = breaks, plot = FALSE)
plot(hi, freq = FALSE, col = adjustcolor(blue, .35), border = "white",
     ylim = c(0, max(hi$density, hr$density) * 1.28),
     main = "今回の招待者・回答者の所得", xlab = "年間所得（万円）", ylab = "密度")
plot(hr, freq = FALSE, col = adjustcolor(orange, .45), border = "white", add = TRUE)
abline(v = population_mean, col = blue, lty = 2, lwd = 2)
abline(v = response_target, col = orange, lty = 3, lwd = 2)
legend("topright", c("招待者", "回答者", "母平均", "回答者集団の平均"),
       col = c(blue, orange, blue, orange), lwd = c(7, 7, 2, 2),
       lty = c(1, 1, 2, 3), bty = "n", cex = .88)

limits <- range(repeated[, 1:2], population_mean, response_target, na.rm = TRUE)
breaks <- pretty(limits, n = 32)
hi <- hist(repeated[, "invited_mean"], breaks = breaks, plot = FALSE)
hr <- hist(repeated[valid, "respondent_mean"], breaks = breaks, plot = FALSE)
plot(hi, freq = FALSE, col = adjustcolor(blue, .4), border = "white",
     ylim = c(0, max(hi$density, hr$density) * 1.35),
     main = sprintf("%d回の調査から得る平均所得", B), xlab = "各調査の平均（万円）", ylab = "密度")
plot(hr, freq = FALSE, col = adjustcolor(orange, .45), border = "white", add = TRUE)
abline(v = population_mean, col = blue, lty = 2, lwd = 2)
abline(v = response_target, col = orange, lty = 3, lwd = 2)
legend("topright", c("招待者平均", "回答者平均", "母平均", "回答者集団の平均"),
       col = c(blue, orange, blue, orange), lwd = c(7, 7, 2, 2),
       lty = c(1, 1, 2, 3), bty = "n", cex = .88)

result <- list(
  settings = data.frame(setting = c("N", "B", "p", "mu0", "gap", "sigma", "r0", "r1", "seed"),
                        value = c(N, B, p, mu0, gap, sigma, r0, r1, seed)),
  model = c("a ~ Bernoulli(p); u = sigma * (Exp(1) - 1); a and u independent",
            "y = mu0 + gap * a + u; response ~ Bernoulli(r_a), independently of u given a"),
  metrics = data.frame(
    key = c("population_mean", "response_target", "invited_mean", "respondent_mean", "respondents",
            "population_share", "response_share", "sample_response_share", "mc_invited", "mc_respondent", "valid_repetitions"),
    label = c("母平均", "回答者集団の平均・理論値", "今回の招待者平均", "今回の回答者平均", "今回の回答者数",
              "母集団の地域B比率", "回答者集団の地域B比率・理論値", "今回の回答者の地域B比率",
              "招待者平均の反復平均", "回答者平均の反復平均", "回答者平均を計算できた反復数"),
    value = c(population_mean, response_target, mean(dat$y), mean(respondents$y), nrow(respondents),
              p, response_share, mean(respondents$a), mean(repeated[, 1]), mean(repeated[valid, 2]), sum(valid))),
  data = dat,
  repetitions = data.frame(b = seq_len(B), repeated),
  groups = data.frame(a = 0:1, population_share = c(1-p, p), response_probability = c(r0, r1),
                      mean_income = c(mu0, mu0 + gap)),
  plot_titles = c("地域の構成", "個人の所得分布", "平均所得の標本分布"),
  plot_notes = c("青は地域A，橙は地域Bである。",
                 "棒は今回の所得分布，縦線は生成モデルの平均である。",
                 "各棒は調査を取り直したときの平均の分布である。回答者0人の回の回答者平均はNAとして保存する。"))
print(result$metrics[, c("label", "value")], row.names = FALSE)
invisible(result)
