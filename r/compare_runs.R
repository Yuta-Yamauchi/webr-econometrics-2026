# 保存済みのresultを同じ目盛りで描く。標本生成・推定は行わない。
# source("r/compare_runs.R")
# comparison <- econometrics_compare("sampling", baseline_result, current_result)
econometrics_compare <- function(kind, reference, current, views = NULL) {
  runs <- list(reference, current)
  blue <- "#005A85"; orange <- "#B45A20"; ink <- "#182632"; green <- "#267356"
  setting <- function(r, key) as.character(r$settings$value[match(key, r$settings$setting)])
  number <- function(r, key) as.numeric(setting(r, key))
  metric <- function(r, key) as.numeric(r$metrics$value[match(key, r$metrics$key)])
  finite <- function(x) { x <- as.numeric(unlist(x)); x[is.finite(x)] }
  extent <- function(x, pad = .04) {
    z <- range(finite(x))
    if (length(z) != 2 || !all(is.finite(z))) stop("比較図に有限の値がない。")
    if (diff(z) < 1e-10) z <- z + c(-1, 1) * max(1, abs(z[1]) * .01)
    z + c(-1, 1) * diff(z) * pad
  }
  setup <- function() {
    par(mfrow = c(1, 1), family = getOption("econometrics.font", "sans"),
        mar = c(4.8, 6, 2.6, 1), mgp = c(3.2, .75, 0),
        col = ink, col.axis = ink, col.lab = ink, fg = ink, las = 1,
        bty = "l", cex = 1, xpd = FALSE)
  }
  # 縦軸名は軸の上に横書きで置き，桁数の多い目盛りと分ける。
  vertical_title <- function(label) mtext(label, side = 3, line = .4, adj = 0, cex = .85)
  plot <- function(..., ylab = "") {
    graphics::plot(..., ylab = "")
    vertical_title(ylab)
  }
  barplot <- function(..., ylab = "") {
    at <- graphics::barplot(..., ylab = "")
    vertical_title(ylab)
    invisible(at)
  }
  axes <- list(); bins <- list()
  # 凡例は描画領域の外へまとめ，点や分布を覆わない。
  legend_args <- NULL
  legend <- function(x, legend, ...) {
    legend_args <<- c(list(legend = legend), list(...))
    invisible(NULL)
  }
  remember <- function(id, side) {
    u <- par("usr")
    axes[[length(axes) + 1L]] <<- data.frame(view = id, side = side,
      x_min = u[1], x_max = u[2], y_min = u[3], y_max = u[4])
  }
  pair <- function(id, draw) {
    if (!is.null(views) && !id %in% views) return(invisible(NULL))
    for (i in 1:2) {
      setup(); legend_args <<- NULL
      has_legend <- !id %in% c("predictors", "projection_error")
      if (has_legend) layout(matrix(1:2, ncol = 1), heights = c(5, 1.35))
      draw(runs[[i]], i); remember(id, i)
      if (has_legend) {
        par(mar = c(.2, .4, .2, .4), xpd = NA, cex = 1)
        plot.new()
        if (!is.null(legend_args)) {
          legend_args[c("cex", "horiz", "bty", "y.intersp")] <- NULL
          do.call(graphics::legend, c(list(x = "center", ncol = 2, cex = .9, bty = "n", y.intersp = 1.7), legend_args))
        }
      }
    }
  }
  # 全実行・全系列から共通区間を作り，各系列の密度を計算する。
  histogram_pair <- function(id, samples, xlab, colors, labels,
                             targets = list(numeric(), numeric()), target_labels = NULL,
                             target_colors = ink, target_types = 2,
                             densities = NULL, density_labels = NULL, density_color = orange,
                             extra_range = numeric()) {
    xlim <- extent(c(samples, targets, extra_range), pad = 0)
    breaks <- pretty(xlim, n = 30)
    hs <- lapply(samples, function(series) lapply(series, function(v)
      hist(finite(v), breaks = breaks, plot = FALSE)))
    xx <- seq(min(breaks), max(breaks), length.out = 1200)
    curves <- if (is.null(densities)) list(numeric(), numeric()) else lapply(densities, function(f) f(xx))
    ylim <- c(0, max(finite(c(lapply(hs, function(series) lapply(series, `[[`, "density")), curves))) * 1.3)
    bins[[id]] <<- breaks
    pair(id, function(r, i) {
      par(mar = c(4.8, 8, 2.6, 1))
      plot(hs[[i]][[1]], freq = FALSE, xlim = range(breaks), ylim = ylim,
           col = adjustcolor(colors[1], .4), border = "white", main = "", xlab = xlab, ylab = "", xaxt = "n")
      axis(1, at = pretty(range(breaks), n = 4))
      vertical_title("密度")
      if (length(hs[[i]]) > 1) for (j in 2:length(hs[[i]]))
        plot(hs[[i]][[j]], freq = FALSE, col = adjustcolor(colors[j], .4), border = "white", add = TRUE)
      if (!is.null(densities)) lines(xx, curves[[i]], col = density_color, lwd = 2.5)
      if (length(targets[[i]])) for (j in seq_along(targets[[i]]))
        abline(v = targets[[i]][j], col = rep(target_colors, length.out = length(targets[[i]]))[j],
               lty = rep(target_types, length.out = length(targets[[i]]))[j], lwd = 2)
      labs <- if (is.function(labels)) labels(r) else labels
      dlabs <- if (is.function(density_labels)) density_labels(r) else density_labels
      legend("topright", c(labs, dlabs, target_labels),
        col = c(adjustcolor(colors, .6), if (!is.null(densities)) density_color, if (length(target_labels)) rep(target_colors, length.out = length(target_labels))),
        pch = c(rep(15, length(labs)), rep(NA, length(dlabs) + length(target_labels))), pt.cex = 1.4,
        lty = c(rep(NA, length(labs)), rep(1, length(dlabs)), rep(target_types, length.out = length(target_labels))),
        lwd = 2, bty = "n")
    })
  }
  if (kind == "survey") {
    pair("composition", function(r, i) {
      d <- r$data; rr <- d$response == 1
      shares <- c(number(r, "p"), mean(d$a), mean(d$a[rr]))
      barplot(rbind(1 - shares, shares), col = c(blue, orange), border = NA,
        names.arg = c("母集団", "依頼対象者", "回答者"), ylim = c(0, 1.25), ylab = "構成比")
      legend("top", c("地域A", "地域B"), fill = c(blue, orange), bty = "n", horiz = TRUE, cex = .95)
    })
    histogram_pair("means", lapply(runs, function(r) list(r$repetitions$invited_mean, r$repetitions$respondent_mean)),
      "各調査の平均（万円）", c(blue, orange), c("依頼対象者平均", "回答者平均"),
      lapply(runs, function(r) c(metric(r, "population_mean"), metric(r, "response_target"))),
      c("母平均", "回答者集団の平均"), c(blue, orange), c(2, 3))
  } else if (kind == "prediction") {
    if (!exists("energy_plot",mode="function")) source("r/energy_plots.R",encoding="UTF-8")
    selected <- if (is.null(views)) energy_views else energy_views[energy_views %in% views]
    for (id in selected) {
      limits <- energy_limits(runs,id)
      for (i in 1:2) {
        u <- energy_plot(runs[[i]],id,limits)
        axes[[length(axes)+1L]] <- data.frame(view=id,side=i,x_min=u[1],x_max=u[2],y_min=u[3],y_max=u[4])
      }
    }
  } else if (kind == "auxiliary") {
    for (centered in c(FALSE, TRUE)) {
      xkey <- if (centered) "dr" else "d"; ykey <- if (centered) "yr" else "y"
      xlim <- extent(lapply(runs, function(r) r$data[[xkey]]), .08)
      ylim <- extent(lapply(runs, function(r) r$data[[ykey]]), .12)
      pair(if (centered) "centered" else "raw", function(r, i) {
        d <- r$data
        plot(d[[xkey]], d[[ykey]], pch = c(16, 17)[d$a + 1], col = adjustcolor(c(blue, orange)[d$a + 1], .55),
          xlim = xlim, ylim = ylim,
          xlab = if (centered) "教育年数の地域平均との差（年）" else "教育年数 d（年）",
          ylab = if (centered) "所得の地域平均との差（万円）" else "年間所得 y（万円）")
        if (centered) {
          abline(h = 0, v = 0, col = "#BCCED8", lty = 3)
          abline(0, metric(r, "auxiliary"), col = ink, lty = 2, lwd = 2)
        } else {
          abline(100, number(r, "beta"), col = blue, lwd = 2)
          abline(100 + number(r, "gamma"), number(r, "beta"), col = orange, lwd = 2)
          # 保存済みの係数と標本平均から切片を復元する。
          abline(mean(d$y) - metric(r, "raw") * mean(d$d), metric(r, "raw"), col = ink, lty = 2, lwd = 2)
        }
        legend("topleft", c("地域A", "地域B", if (centered) "補助回帰" else "全体の単回帰"),
          pch = c(16, 17, NA), col = c(blue, orange, ink), lty = if (centered) c(NA, NA, 2) else c(1, 1, 2),
          lwd = 2, bty = "n", cex = .95)
      })
    }
    histogram_pair("coefficients", lapply(runs, function(r) list(r$repetitions$raw, r$repetitions$full)),
      "教育年数の係数（万円／年）", c(orange, blue), c("単回帰", "重回帰"),
      lapply(runs, function(r) c(metric(r, "raw_target"), metric(r, "true_beta"))),
      c("単回帰の母集団係数", "生成式の係数"), c(orange, blue))
  } else if (kind == "precision") {
    xlim <- extent(lapply(runs, function(r) r$data$x1)); ylim <- extent(lapply(runs, function(r) r$data$x2), .08)
    pair("predictors", function(r, i) {
      plot(r$data$x1, r$data$x2, pch = 16, col = adjustcolor(blue, .55), xlim = xlim, ylim = ylim,
        xlab = "経験年数（年）", ylab = "勤続年数（年）")
    })
    for (j in 1:2) {
      key <- paste0("beta", j); sdkey <- paste0("theory_sd", j)
      densities <- lapply(runs, function(r) { target <- number(r, key); ss <- metric(r, sdkey); function(x) dnorm(x, target, ss) })
      extra <- lapply(runs, function(r) number(r, key) + c(-4, 4) * metric(r, sdkey))
      histogram_pair(key, lapply(runs, function(r) list(r$repetitions[[key]])), c("経験年数の係数（万円／年）", "勤続年数の係数（万円／年）")[j], blue, "各回の推定値",
        lapply(runs, function(r) number(r, key)), "生成式の係数", densities = densities,
        density_labels = "条件付き正規密度", extra_range = extra)
    }
    histogram_pair("variance", lapply(runs, function(r) list(r$repetitions$variance_naive, r$repetitions$variance_corrected)),
      "分散（万円²）", c(orange, blue), c("RSS / N", "RSS / (N − 3)"),
      lapply(runs, function(r) number(r, "sigma")^2), "誤差の分散 σ²")
  } else if (kind == "sampling") {
    population_density <- function(r) {
      mu <- number(r, "mu"); sigma <- number(r, "sigma"); distribution <- setting(r, "distribution")
      function(x) { z <- (x - mu) / sigma; switch(distribution, normal = dnorm(z), exponential = dexp(z + 1), uniform = dunif(z, -sqrt(3), sqrt(3))) / sigma }
    }
    histogram_pair("sample", lapply(runs, function(r) list(r$data$y)), "年間所得（万円）", blue, "今回の標本",
      lapply(runs, function(r) c(number(r, "mu"), metric(r, "observed_mean"))), c("母平均", "標本平均"), c(ink, orange), c(2, 1),
      densities = lapply(runs, population_density), density_labels = "母集団の密度", density_color = blue,
      extra_range = lapply(runs, function(r) number(r, "mu") + number(r, "sigma") * c(-4, 7)))
    densities <- lapply(runs, function(r) { mu <- number(r, "mu"); ss <- metric(r, "theory_sd"); function(x) dnorm(x, mu, ss) })
    histogram_pair("means", lapply(runs, function(r) list(r$repetitions$y_bar)), "各調査の平均所得（万円）", blue, "各回の平均所得",
      lapply(runs, function(r) number(r, "mu")), "母平均", densities = densities,
      density_labels = function(r) if (setting(r, "distribution") == "normal") "標本平均の正規密度" else "正規近似の密度",
      extra_range = lapply(runs, function(r) number(r, "mu") + c(-4, 4) * metric(r, "theory_sd")))
    histogram_pair("standardized", lapply(runs, function(r) list(r$repetitions$standardized)),
      expression(sqrt(N) * (bar(y)[N] - mu) / sigma), blue, "反復結果", densities = list(dnorm, dnorm), density_labels = "標準正規密度", extra_range = c(-4, 4))
  } else if (kind == "asymptotic") {
    large <- lapply(runs, function(r) r$repetitions[r$repetitions$N == 4 * number(r, "N"), ])
    samples <- lapply(runs, function(r) list(r$repetitions$beta1[r$repetitions$N == number(r, "N")], r$repetitions$beta1[r$repetitions$N == 4 * number(r, "N")]))
    histogram_pair("coefficients", samples, "経験年数の係数（万円／年）", c(orange, blue),
      function(r) c(paste0("N = ", number(r, "N")), paste0("4N = ", 4 * number(r, "N"))),
      lapply(runs, function(r) number(r, "beta1")), "生成式の係数")
    histogram_pair("standardized", lapply(large, function(d) list(d$standardized)), "標準化した係数の推定誤差", blue, function(r) paste0("4N = ", 4 * number(r, "N")),
      densities = list(dnorm, dnorm), density_labels = "標準正規密度", extra_range = c(-4, 4))
    for (ratio in c(FALSE, TRUE)) {
      xx <- lapply(1:2, function(i) if (ratio) large[[i]]$ratio_linear - metric(runs[[i]], "ratio_target") else large[[i]]$influence_scaled)
      yy <- lapply(1:2, function(i) if (ratio) large[[i]]$ratio - metric(runs[[i]], "ratio_target") else large[[i]]$exact_scaled)
      limits <- extent(c(xx, yy), .06)
      pair(if (ratio) "ratio" else "influence", function(r, i) {
        plot(xx[[i]], yy[[i]], pch = 16, col = adjustcolor(blue, .4), xlim = limits, ylim = limits,
          xlab = if (ratio) "一次近似 H(β̂ − β)" else "Qを使った近似（√n倍）",
          ylab = if (ratio) "係数比の推定誤差" else "OLSの推定誤差（√n倍）")
        abline(0, 1, col = ink, lty = 2, lwd = 2)
        legend("topleft", c(paste0("n = 4N = ", 4 * number(r, "N")), "一次近似 = 推定誤差"),
          pch = c(16, NA), col = c(blue, ink), lty = c(NA, 2), lwd = 2, bty = "n", cex = .95)
      })
    }
  } else stop("未対応のシミュレーションである。")
  list(axes = do.call(rbind, axes), breaks = bins)
}
